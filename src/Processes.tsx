import { createSignal, onCleanup, type Component } from 'solid-js';

import styles from './App.module.css';

enum Status {
  Closed,
  Loading,
  Open,
  Running,
}

interface MyComponentProps {
  apiurl: string;
  item: string;
  onUpdate: () => void;
  isopen: boolean;
  hasredirect: boolean;
}

async function fetchPlus(url:string, method:string="GET") {
  await fetch(url, {method:method}).then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then((result) => {
    console.log('Response:', result); 
  })
  .catch((error) => {
    console.error(`There was an error when calling ${method} ${url}`, error);
  }); 
}

const Processes: Component<MyComponentProps> = (props) => {
  const [status, setStatus] = createSignal(Status.Closed)
  let retryInterval: number | undefined;

  const openTask = async (item:string) => {
    await fetchPlus(`${props.apiurl}/open/${item}`, "POST")
  }

  const closeTask = async (item:string) => {
    await fetchPlus(`${props.apiurl}/close/${item}`, "DELETE");
    props.onUpdate();
  }

  const handleRedirect = () => {
    window.location.href = `http://100.127.215.111:5041/redirect/${props.item}`; 
  }

  const checkUrl = async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 500);
      const response = await fetch(`http://100.127.215.111:5041/redirect/${props.item}`, { method: "GET" , signal: controller.signal });
      clearTimeout(id);

      if (response.ok) {
        setStatus(Status.Running);
        console.log(props.item, "running");
        return true;
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.error("Request timed out");
      } else {
        console.error("Error fetching URL:", error);
      }
    }
    setStatus(Status.Loading);
    console.log(props.item, "loading");
    return false;
  };

  // Retry logic
  const startRetry = () => {
    retryInterval = setInterval(async () => {
      const isAvailable = await checkUrl();
      if (isAvailable) {
        clearInterval(retryInterval);
      }
    }, 1000);
  };

  // Cleanup interval on component unmount
  onCleanup(() => clearInterval(retryInterval));
  
  const mainLoop = async () => {
    if (props.isopen) {
      if (!props.hasredirect){
        setStatus(Status.Open)
        console.log(props.item, "open")
      }
      else {
        await checkUrl();
        if (status()===Status.Loading)
          startRetry();
      }
    }
  }

  mainLoop();

  return (
    <div style="padding-top: 0.5rem;">
      {props.item}:
      <button disabled={props.isopen} onclick={() => openTask(props.item)}>open</button>
      {props.isopen && <button onclick={() => closeTask(props.item)}>close</button>}
      {props.isopen && props.hasredirect && <button disabled={status()!==Status.Running} onclick={() => handleRedirect()}>redirect</button>}
    </div>
  );
};

export default Processes;
