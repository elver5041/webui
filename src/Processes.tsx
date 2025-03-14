import { createSignal, onCleanup, type Component } from 'solid-js';

import styles from './App.module.css';

enum Status {
  Closed,
  Loading,
  Running,
  Served,
}


interface MyComponentProps {
  apiurl: string;
  item: string;
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

  const Update = async () => {
    try {
      const processes_response = await fetch(`${props.apiurl}/processes/${props.item}`);
      const processes_result:Task = await processes_response.json();
      setStatus(processes_result.status);
    } catch (error) {
      console.error('Error fetching data:', error);
    } 
  };

  const isOpen = ()=>{
    return status() != Status.Closed
  }

  const openTask = async (item:string) => {
    await fetchPlus(`${props.apiurl}/processes/${item}`, "POST");
    
    const processes_response = await fetch(`${props.apiurl}/processes/${props.item}`);
    const processes_result:Task = await processes_response.json();
    setStatus(processes_result.status);
    
    Update()
  }

  const closeTask = async (item:string) => {
    await fetchPlus(`${props.apiurl}/processes/${item}`, "DELETE");
    Update();
  }

  const handleRedirect = () => {
    window.location.href = `${props.apiurl}/processes/${props.item}/redirect`;
  }

  const checkStatus = async () => {
    const response = await fetch(`${props.apiurl}/processes/${props.item}`)
      .then((response)=>{
        if (response.ok) {
          return response.json()
        }
      }).then((data:Task)=>{
        return data.status;
      });
    setStatus(response);
  };


  const startRetry = () => {
    retryInterval = setInterval(async () => {
      await checkStatus();
      if (status()==Status.Served) {
        clearInterval(retryInterval);
      }
    }, 1000);
  };

  onCleanup(() => clearInterval(retryInterval));
  
  const mainLoop = async () => {
    if (props.isopen) {
      if (!props.hasredirect){
        setStatus(Status.Running)
        console.log(props.item, "open")
      }
      else {
        await checkStatus();
        if (status()===Status.Loading)
          startRetry();
      }
    }
  }

  mainLoop();

  return (
    <div style="padding-top: 0.5rem;">
      {`${props.item}: `}
      <button disabled={isOpen()} onclick={() => openTask(props.item)}>open</button>
      {isOpen() && <button onclick={() => closeTask(props.item)}>close</button>}
      {isOpen() && props.hasredirect && <button disabled={status()==Status.Served} onclick={() => handleRedirect()}>redirect</button>}
    </div>
  );
};

export default Processes;
