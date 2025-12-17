/**
 * Example: How to fetch content detail with authentication
 * 
 * This example shows how to use the getContentById function
 * which requires a Clerk authentication token.
 * 
 * Usage in a React component:
 */

import { getContentById } from '@/lib/api';
import { ContentDetail } from '@/types/api';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export function ContentDetailExample({ contentId }: { contentId: string }) {
  const { getToken } = useAuth();
  const [contentDetail, setContentDetail] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContentDetail() {
      try {
        setLoading(true);
        setError(null);

        // Get the authentication token from Clerk
        const token = await getToken();
        
        if (!token) {
          throw new Error('No authentication token available');
        }

        // Fetch the content detail with authentication
        const detail = await getContentById(contentId, token);
        setContentDetail(detail);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content detail';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchContentDetail();
  }, [contentId, getToken]);

  if (loading) {
    return <Text>Loading content detail...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  if (!contentDetail) {
    return <Text>No content found</Text>;
  }

  return (
    <View>
        <Text className="text-center font-product text-xl text-zinc-800">
                 {contentDetail.title}
                  </Text>
                  <Text className="pb-10  font-sans text-base text-zinc-700">
                   {contentDetail.content}
                  </Text>
    
    </View>
  );
}
