import { createSignal, onMount, For, Show, type Component } from "solid-js";

interface FileItem {
  name: string;
  is_dir: boolean;
}

interface FileComponentProps {
  apiurl: string;
}


function shortenFilename(name: string, maxLen = 50) {
  const parts = name.split(".");
  if (parts.length < 2) return name.length > maxLen ? name.slice(0, maxLen - 3) + "..." : name;
  
  const ext = "." + parts.pop(); // .pdf, .txt
  const base = parts.join(".");
  
  if (base.length + ext.length <= maxLen) return base + ext;
  
  return base.slice(0, maxLen - ext.length - 3) + "..." + ext;
}



const FileBrowser: Component<FileComponentProps> = (props) => {
  const [files, setFiles] = createSignal<FileItem[]>([]);
  const [path, setPath] = createSignal<string>("");
  const [drives, setDrives] = createSignal<string[]>([]);
  const [currentDrive, setCurrentDrive] = createSignal<string>("");


  const fetchDrives = async () => {
    const res = await fetch(`${props.apiurl}/drives`);
    const data = await res.json();
    if (data.drives) {
      console.log(data.drives)
      setDrives(data.drives);
      setCurrentDrive(data.drives[0]); // pick first drive by default
      fetchFiles("", data.drives[0]);
    }
  };

  const fetchFiles = async (newPath: string = "", drive: string = currentDrive()): Promise<void> => {
    const cleanPath = newPath.startsWith(drive) ? newPath : drive + (newPath ? "/" + newPath : "");
    const res = await fetch(
      `${props.apiurl}/list?path=${encodeURIComponent(cleanPath)}`
    );
    const data = await res.json();
    if (data.files) {
      setFiles(data.files as FileItem[]);
      setPath(data.path as string);
    }
  };

  const downloadFile = (name: string): void => {
    const fullPath = `${path() ? path() : ""}/${name}`;
    window.open(
      `${props.apiurl}/download?path=${encodeURIComponent(fullPath)}`,
      "_blank"
    );
  };

  const goUp = (): void => {
    const parts = path().split("\\").filter(Boolean);
    parts.pop();
    fetchFiles(parts.join("\\").concat("\\"));
  };

  onMount(() => {
    fetchDrives(); // initial load
  });

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ "margin-bottom": "0.75rem" }}>
        <label style={{ "margin-right": "0.5rem", "font-weight": 600 }}>Drive:</label>
        <select
          value={currentDrive()}
          onChange={(e) => {
            const drive = (e.target as HTMLSelectElement).value;
            setCurrentDrive(drive);
            fetchFiles("", drive); // reset to root of selected drive
          }}
          class="drive-select"
        >
          <For each={drives()}>
            {(d) => <option value={d}>{d}</option>}
          </For>
        </select>
      </div>
      <p>Current path: {path() || "/"}</p>
      <ul class="file-list">
        <Show when={path()}>
          <li class="file-item" onClick={goUp}>
            <i class="file-icon fa fa-level-up-alt"></i>
            ..
          </li>
        </Show>
        <For each={files()}>
          {(f) => (
            <li class="file-item">
              {f.is_dir ? (
                <>
                  <i class="file-icon fa fa-folder"></i>
                  <span class="text" onClick={() => fetchFiles(`${path()}/${f.name}/`)}>
                    [{shortenFilename(f.name)}]
                  </span>
                </>
              ) : (
                <span onClick={() => downloadFile(f.name)}>{shortenFilename(f.name)}</span>
              )}
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

export default FileBrowser;