import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchClustersWithThoughts,
  createCluster,
  updateCluster,
  addThoughtToCluster as addThoughtQuery,
  removeThoughtFromCluster as removeThoughtQuery,
  fetchConnections as fetchConnectionsFromDB,
  fetchConnectionMetadata
} from '@/integrations/supabase/queries';
import { sanitizeClusterName } from '@/utils/sanitize';
import { APP_CONFIG } from '@/config/app.config';
import { useToast } from '@/hooks/use-toast';
import { Cluster, Connection, ThoughtWithCategories, ConnectionRow } from '@/types/thought.types';
import { TOAST_MESSAGES } from '@/utils/toast-messages';

export function useClusters(thoughts: ThoughtWithCategories[]) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [unclusteredThoughts, setUnclusteredThoughts] = useState<ThoughtWithCategories[]>([]);
  const [unclusteredCount, setUnclusteredCount] = useState(0);
  const { toast } = useToast();

  // Calculate unclustered thoughts
  useEffect(() => {
    const clusteredIds = new Set<string>();
    clusters.forEach(cluster => {
      cluster.thought_clusters?.forEach(tc => {
        clusteredIds.add(tc.thoughts.id);
      });
    });

    const unclustered = thoughts.filter(t => !clusteredIds.has(t.id));
    setUnclusteredThoughts(unclustered);
    setUnclusteredCount(unclustered.length);
  }, [thoughts, clusters]);

  const fetchClusters = async () => {
    try {
      const { data, error } = await fetchClustersWithThoughts();
      if (error) throw error;
      // Query returns ClusterWithThoughtsResult, cast to app type
      setClusters(data as unknown as Cluster[]);
    } catch (error: any) {
      toast(TOAST_MESSAGES.cluster.fetchError(error.message));
    }
  };

  const generateClusters = async () => {
    const minRequired = APP_CONFIG.clustering.minThoughtsForClustering;
    
    if (unclusteredCount < minRequired) {
      toast({
        title: "Not enough thoughts",
        description: `You need at least ${minRequired} unclustered thoughts. You currently have ${unclusteredCount}.`,
        variant: "destructive"
      });
      return [];
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-clusters');

      if (error) throw error;

      // Edge function response validation
      interface GenerateClustersResponse {
        clusters?: Array<{ id: string; name: string }>;
        error?: string;
        message?: string;
      }

      const response = data as GenerateClustersResponse;

      if (!response || response.error) {
        const message = response?.error || 'Failed to generate clusters';
        toast(TOAST_MESSAGES.cluster.generateError(message));
        return [];
      }

      const clusterCount = response.clusters?.length || 0;
      if (clusterCount > 0) {
        toast({
          title: "Success!",
          description: `AI organized your thoughts into ${clusterCount} new cluster${clusterCount !== 1 ? 's' : ''}.`,
        });
      } else if (response.message) {
        toast({
          title: "No clusters created",
          description: response.message,
        });
      }
      
      await fetchClusters();
      return response.clusters || [];
    } catch (error: any) {
      toast(TOAST_MESSAGES.cluster.generateError(error.message));
      throw error;
    }
  };

  const createManualCluster = async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Sanitize cluster name
      const sanitizedName = sanitizeClusterName(name);
      
      if (!sanitizedName) {
        toast({
          title: "Error",
          description: "Cluster name cannot be empty",
          variant: "destructive"
        });
        throw new Error('Cluster name cannot be empty');
      }

      const { data, error } = await createCluster(user.id, sanitizedName, true);
      if (error) throw error;

      toast({
        title: "Cluster created",
        description: `Created cluster "${sanitizedName}"`,
      });

      await fetchClusters();
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const renameCluster = async (clusterId: string, newName: string) => {
    try {
      // Sanitize cluster name
      const sanitizedName = sanitizeClusterName(newName);
      
      if (!sanitizedName) {
        toast({
          title: "Error",
          description: "Cluster name cannot be empty",
          variant: "destructive"
        });
        throw new Error('Cluster name cannot be empty');
      }

      const { error } = await updateCluster(clusterId, { name: sanitizedName });
      if (error) throw error;

      toast({
        title: "Cluster renamed",
        description: `Renamed to "${sanitizedName}"`,
      });

      await fetchClusters();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const addThoughtToCluster = async (thoughtId: string, clusterId: string) => {
    try {
      const { error } = await addThoughtQuery(thoughtId, clusterId);
      if (error) throw error;
      await fetchClusters();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const removeThoughtFromCluster = async (thoughtId: string, clusterId: string) => {
    try {
      const { error } = await removeThoughtQuery(thoughtId, clusterId);
      if (error) throw error;
      await fetchClusters();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const findRelatedThoughts = async (clusterId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('find-related-thoughts', {
        body: { clusterId }
      });

      if (error) throw error;

      const count = data?.count || 0;
      if (count > 0) {
        toast({
          title: "Found related thoughts",
          description: `Added ${count} related thought${count !== 1 ? 's' : ''} to this cluster.`,
        });
        await fetchClusters();
      } else {
        toast({
          title: "No related thoughts found",
          description: "Couldn't find any unclustered thoughts that match this cluster's theme.",
        });
      }

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const loadConnectionsFromDB = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch connections from database
      const { data: dbConnections, error } = await fetchConnectionsFromDB(user.id);
      if (error) throw error;

      // Transform database rows to Connection format
      const transformedConnections: Connection[] = await Promise.all(
        (dbConnections || []).map(async (conn: ConnectionRow) => {
          // Fetch thought details for each connection
          const [thought1, thought2] = await Promise.all([
            supabase.from('thoughts').select(`
              id, title, is_completed,
              thought_categories(categories(name))
            `).eq('id', conn.thought1_id).single(),
            supabase.from('thoughts').select(`
              id, title, is_completed,
              thought_categories(categories(name))
            `).eq('id', conn.thought2_id).single()
          ]);

          return {
            id: conn.id,
            thought1_id: conn.thought1_id,
            thought2_id: conn.thought2_id,
            thought1: {
              title: thought1.data?.title || '',
              categories: thought1.data?.thought_categories?.map((tc: any) => tc.categories.name) || [],
              is_completed: thought1.data?.is_completed || false
            },
            thought2: {
              title: thought2.data?.title || '',
              categories: thought2.data?.thought_categories?.map((tc: any) => tc.categories.name) || [],
              is_completed: thought2.data?.is_completed || false
            },
            title: conn.title,
            description: conn.description,
            reason: conn.description, // Backward compatibility
            connection_type: conn.connection_type,
            is_dismissed: conn.is_dismissed,
            created_at: conn.created_at
          };
        })
      );

      return transformedConnections;
    } catch (error: any) {
      console.error('Error loading connections from DB:', error);
      return [];
    }
  };

  const findConnections = async (forceRefresh: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Phase 2: Check if we should use cached connections
      if (!forceRefresh) {
        const { data: metadata } = await fetchConnectionMetadata(user.id);
        
        if (metadata?.last_full_analysis_at) {
          const lastAnalysis = new Date(metadata.last_full_analysis_at);
          const now = new Date();
          const hoursSinceLastAnalysis = (now.getTime() - lastAnalysis.getTime()) / (1000 * 60 * 60);
          
          // If analyzed in last 2 hours, load from database instead of re-running AI
          if (hoursSinceLastAnalysis < 2) {
            console.log('Loading cached connections (analyzed', Math.round(hoursSinceLastAnalysis * 60), 'minutes ago)');
            const cachedConnections = await loadConnectionsFromDB();
            setConnections(cachedConnections);
            
            if (cachedConnections.length > 0) {
              toast({
                title: "Loaded saved connections",
                description: `Showing ${cachedConnections.length} connection${cachedConnections.length !== 1 ? 's' : ''} (last updated ${Math.round(hoursSinceLastAnalysis * 60)}min ago)`,
              });
            }
            
            return cachedConnections;
          }
        }
      }

      // Phase 1: Run AI analysis and save to database
      const { data, error } = await supabase.functions.invoke('find-connections');

      if (error) throw error;
      const foundConnections = data.connections || [];
      
      // Load connections from database (they were saved by the Edge Function)
      const refreshedConnections = await loadConnectionsFromDB();
      setConnections(refreshedConnections);
      
      if (refreshedConnections.length > 0) {
        toast(TOAST_MESSAGES.connection.found(refreshedConnections.length));
      }
      
      return refreshedConnections;
    } catch (error: any) {
      toast(TOAST_MESSAGES.connection.findError(error.message));
      throw error;
    }
  };

  const checkClusterCompletion = (cluster: Cluster) => {
    if (!cluster.thought_clusters || cluster.thought_clusters.length === 0) {
      return { completed: 0, total: 0, isFullyCompleted: false };
    }
    
    const activeThoughts = cluster.thought_clusters.filter(
      tc => tc.thoughts.status === 'active'
    );
    
    const completedThoughts = activeThoughts.filter(
      tc => tc.thoughts.is_completed
    );
    
    return {
      completed: completedThoughts.length,
      total: activeThoughts.length,
      isFullyCompleted: activeThoughts.length > 0 && 
                        completedThoughts.length === activeThoughts.length
    };
  };

  const archiveCluster = async (clusterId: string) => {
    try {
      const cluster = clusters.find(c => c.id === clusterId);
      if (!cluster?.thought_clusters) return;
      
      const thoughtIds = cluster.thought_clusters.map(tc => tc.thoughts.id);
      
      await Promise.all(
        thoughtIds.map(id =>
          supabase
            .from('thoughts')
            .update({ status: 'archived' })
            .eq('id', id)
        )
      );
      
      toast({
        title: 'Cluster archived',
        description: `"${cluster.name}" and all its thoughts moved to archive`
      });
      
      await fetchClusters();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteCluster = async (clusterId: string) => {
    try {
      // First, remove all thought_cluster associations
      const { error: tcError } = await supabase
        .from('thought_clusters')
        .delete()
        .eq('cluster_id', clusterId);
      
      if (tcError) throw tcError;
      
      // Then, delete the cluster itself
      const { error: clusterError } = await supabase
        .from('clusters')
        .delete()
        .eq('id', clusterId);
      
      if (clusterError) throw clusterError;
      
      toast({
        title: 'Cluster deleted',
        description: 'Cluster removed successfully. Thoughts remain in All Thoughts.'
      });
      
      await fetchClusters();
    } catch (error: any) {
      toast({
        title: 'Error deleting cluster',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchClusters();
    // Load cached connections on mount
    loadConnectionsFromDB().then(setConnections);
  }, []);

  return {
    clusters,
    connections,
    unclusteredThoughts,
    unclusteredCount,
    generateClusters,
    createManualCluster,
    renameCluster,
    addThoughtToCluster,
    removeThoughtFromCluster,
    findRelatedThoughts,
    findConnections,
    checkClusterCompletion,
    archiveCluster,
    deleteCluster,
    loadConnectionsFromDB // Expose for manual refresh
  };
}
