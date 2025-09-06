import { type Component } from 'solid-js';
import { Status } from "./types.js";


interface ProcessComponentProps {
  apiurl: string;
  item: string;
  status: Status;
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


const Processes: Component<ProcessComponentProps> = (props) => {
  const status = () => props.status;

  const isOpen = () => status() != Status.Closed;
  const hasredirect = () => isOpen() && status() != Status.Running;

  const openTask = async (item:string) => {
    await fetchPlus(`${props.apiurl}/processes/${item}`, "POST");
  }

  const closeTask = async (item:string) => {
    await fetchPlus(`${props.apiurl}/processes/${item}`, "DELETE");
  }

  const handleRedirect = () => {
    window.location.href = `${props.apiurl}/processes/${props.item}/redirect`;
  }


  return (
    <div class="task-item">
      <span class="task-label">{props.item}:</span>
      <button disabled={isOpen()} onclick={() => openTask(props.item)}>open</button>
      {isOpen() && <button onclick={() => closeTask(props.item)}>close</button>}
      {isOpen() && hasredirect() && <button disabled={status()==Status.Loading} onclick={() => handleRedirect()}>redirect</button>}
    </div>
  );
};

export default Processes;
