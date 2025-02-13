import type { Component } from 'solid-js';
import styles from './App.module.css';
import { createSignal, createEffect } from 'solid-js';
import Processes from './Processes';
import "./index.css";


const API_URL = `${window.location.protocol}//${window.location.hostname}:5041`

interface Task {
  name:string
  port:Number|null
}

const App: Component = () => {
  const [items, setItems] = createSignal<Array<string>>([]);
  const [data, setData] = createSignal<Array<Task>>([]);
  const [loading, setLoading] = createSignal<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const task_response = await fetch(`${API_URL}/tasks`);
      const task_result:Array<string> = await task_response.json();
      const processes_response = await fetch(`${API_URL}/processes`);
      const processes_result:Array<Task> = await processes_response.json();
      setData(processes_result);
      setItems(task_result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => fetchData());

  const isOpen = (item: string) => data().some(task => task.name === item);
  const hasRedirect = (item: string) => isOpen(item) && data().find(task => task.name === item)?.port != null;

  const shutDown = () => fetch(`${API_URL}/shutdown`);
  const monitorOn = () => fetch(`${API_URL}/monitors/on`);
  const monitorOff = () => fetch(`${API_URL}/monitors/off`);

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        {/*<button onclick={shutDown}>close</button>*/}
        <br/>
        monitors 
        <div style="padding-bottom: 0.5rem;">
          <button onclick={monitorOn}>on</button><button onclick={monitorOff}>off</button>
        </div>
        {
          loading()?
          (<p>loading...</p>)
          :
          items().map(item => (
            <Processes 
              apiurl={API_URL}
              item={item} 
              onUpdate={async () => await fetchData()} 
              isopen={isOpen(item)} 
              hasredirect={hasRedirect(item)}
            />
          ))
        }
      </header>
    </div>
  );
};

export default App;
