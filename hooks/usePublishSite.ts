import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface PublishRequest {
  pieceCid: string;
  datasetId: string;
  subdomain?: string;
}

interface PublishResponse {
  success: boolean;
  message: string;
  subdomain: string;
  subdomainId: string;
  accessUrl: string;
  productionUrl: string;
  pieceCid: string;
  datasetId: string;
  publishedAt: string;
}

interface PublishError {
  error: string;
  details?: string;
}

export const usePublishSite = () => {
  const [publishedSite, setPublishedSite] = useState<PublishResponse | null>(null);

  const generateSubdomainName = (pieceCid: string): string => {
    // Generate a friendly subdomain name from piece CID
    const shortCid = pieceCid.substring(pieceCid.length - 8);
    const timestamp = Date.now().toString().slice(-4);
    return `site-${shortCid}-${timestamp}`.toLowerCase();
  };

  const publishMutation = useMutation({
    mutationFn: async ({ pieceCid, datasetId, subdomain }: PublishRequest): Promise<PublishResponse> => {
      const generatedSubdomain = subdomain || generateSubdomainName(pieceCid);
      const serverUrl = process.env.NEXT_PUBLIC_WARMWEB_SERVER_URL || "https://warmweb.xyz";
      
      const response = await fetch(`${serverUrl}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pieceCid,
          datasetId,
          subdomain: generatedSubdomain,
        }),
      });

      if (!response.ok) {
        const errorData: PublishError = await response.json();
        throw new Error(errorData.error || "Failed to publish site");
      }

      const result: PublishResponse = await response.json();
      setPublishedSite(result);
      return result;
    },
    onError: (error) => {
      console.error("Publish failed:", error);
    },
  });

  const resetPublishedSite = () => {
    setPublishedSite(null);
  };

  return {
    publishSite: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    publishError: publishMutation.error,
    publishedSite,
    resetPublishedSite,
  };
};