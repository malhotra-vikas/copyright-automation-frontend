import { toast } from "react-toastify";

export default async function base64(fil: any) {
  try {
    const file: any = fil;
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = async () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  } catch (err) {
    console.log("err reading file", err);
  }
}
export function downloadFile(file: File) {
  // Step 1: Create a Blob from the file data
  const blob = new Blob([file], { type: file.type });

  // Step 2: Create an object URL for the Blob
  const url = URL.createObjectURL(blob);

  // Step 3: Create a temporary anchor element and trigger the download
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name; // Set the file name for download
  document.body.appendChild(a); // Append to the body
  a.click(); // Programmatically click the anchor to trigger the download
  document.body.removeChild(a); // Clean up
  URL.revokeObjectURL(url); // Free up memory by revoking the object URL
}
export function RemoveDuplicateToast(message: string, toastId: string) {
  if (!toast.isActive(toastId)) {
    toast.error(message, { toastId });
  }
}
