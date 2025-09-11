import { useMutation } from "@tanstack/react-query";
import { useSynapse } from "@/providers/SynapseProvider";

/**
 * Hook to download a piece from the Filecoin network using Synapse.
 */
export const useDownloadPiece = (commp: string, filename: string) => {
  const { synapse } = useSynapse();

  const mutation = useMutation({
    // Keep keys serializable to avoid circular JSON errors
    mutationKey: ["download-piece", commp, filename],
    mutationFn: async () => {
      if (!synapse) throw new Error("Synapse not found");

      const uint8ArrayBytes = await synapse.storage.download(commp);

      const file = new File([uint8ArrayBytes as BlobPart], filename);

      // Download file to browser
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      return file;
    },
    onSuccess: () => {
      console.log("File downloaded", filename);
    },
    onError: (error) => {
      console.error("Error downloading piece", error);
    },
  });

  return {
    downloadMutation: mutation,
  };
};
