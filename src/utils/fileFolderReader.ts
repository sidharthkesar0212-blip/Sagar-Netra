/**
 * Traverses files and directories from drag-and-drop DataTransfer
 * Recursively inspects DirectoryEntries to extract all nested files.
 */
export async function getFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = [];

  if (dataTransfer.items && dataTransfer.items.length > 0) {
    const items = Array.from(dataTransfer.items);

    const traverseEntry = async (entry: any): Promise<void> => {
      if (!entry) return;

      if (entry.isFile) {
        await new Promise<void>((resolve) => {
          entry.file(
            (file: File) => {
              files.push(file);
              resolve();
            },
            () => resolve()
          );
        });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();

        const readAllEntries = async (): Promise<any[]> => {
          let allEntries: any[] = [];
          let batch: any[] = [];
          do {
            batch = await new Promise<any[]>((resolve) => {
              reader.readEntries(
                (entries: any[]) => resolve(entries),
                () => resolve([])
              );
            });
            allEntries = allEntries.concat(batch);
          } while (batch.length > 0);
          return allEntries;
        };

        const dirEntries = await readAllEntries();
        for (const child of dirEntries) {
          await traverseEntry(child);
        }
      }
    };

    const promises: Promise<void>[] = [];
    for (const item of items) {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          promises.push(traverseEntry(entry));
          continue;
        }
      }
      const file = item.getAsFile();
      if (file) files.push(file);
    }

    await Promise.all(promises);
  } else if (dataTransfer.files && dataTransfer.files.length > 0) {
    files.push(...Array.from(dataTransfer.files));
  }

  return files;
}
