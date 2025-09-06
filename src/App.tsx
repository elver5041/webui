import type { Component } from 'solid-js';
import styles from './App.module.css';
import { createSignal, onCleanup, onMount, For, Show } from 'solid-js';
import Processes from './Processes.js';
import FileBrowser from './FileBrowser.js';
import "./index.css";
import {Task, Status} from './types.js';

enum Pages {
  home,
  processes,
  misc,
  files,
}

const API_URL = `${window.location.protocol}//${window.location.hostname}:5041`

const App: Component = () => {
  const [currentPage, setCurrentPage] = createSignal<Pages>(Pages.home);
  const [sideOpen, setSideOpen] = createSignal(false);
  const [items, setItems] = createSignal<Array<string>>([]);
  const [data, setData] = createSignal<Map<string, Task>>(new Map());
  const [loading, setLoading] = createSignal<boolean>(true);

  let ws: WebSocket | null = null;

  const connect = () => {
    ws = new WebSocket(`ws://${window.location.hostname}:5041/ws`);

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { name: string; status: Status };
      setData(prev => {
        const next = new Map(prev); // copy for reactivity
        const existing = next.get(payload.name);

        if (existing) {
          next.set(payload.name, { ...existing, status: payload.status });
        } else {
          next.set(payload.name, { name: payload.name, status: payload.status, port: null });
        }
        console.log(next)
        return next;
      });
    };

    ws.onopen = () => {
      console.log("connected");
    };

    ws.onclose = () => {
      console.log("disconnected, retrying...");
      setTimeout(connect, 1000); // auto-reconnect
    };
  };

  
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const task_response = await fetch(`${API_URL}/tasks`);
      const task_result:Array<string> = await task_response.json();
      setItems(task_result);
      const processes_response = await fetch(`${API_URL}/processes`);
      const processes_result:Array<Task> = await processes_response.json();
      setData(new Map(processes_result.map(task => [task.name, task])));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    fetchData();
    connect();
  });
  
  onCleanup(() => ws?.close());
  const shutDown = () => fetch(`${API_URL}/shutdown`);
  const monitorOn = () => fetch(`${API_URL}/monitors/on`);
  const monitorOff = () => fetch(`${API_URL}/monitors/off`);


  return (
    <div class="app">
      {/* Top bar */}
      <div class="top-bar">
        <div class="logo">elver's hub</div>
        <button class="menu-button" onClick={() => setSideOpen(!sideOpen())}>
          ☰
        </button>
      </div>

      <div class="main">
        {/* Side menu */}
        <Show when={sideOpen() || window.innerWidth >= 768}>
          <div class="side-menu">
            <button onClick={() => {setSideOpen(!sideOpen());setCurrentPage(Pages.home)}}>Home</button>
            <button onClick={() => {setSideOpen(!sideOpen());setCurrentPage(Pages.processes)}}>Procesess</button>
            <button onClick={() => {setSideOpen(!sideOpen());setCurrentPage(Pages.files)}}>File Browsing</button>
            <button onClick={() => {setSideOpen(!sideOpen());setCurrentPage(Pages.misc)}}>Misc.</button>
          </div>
        </Show>

        {/* Main content */}
        <div class="content">
          <Show when={currentPage() === Pages.home}>
            <h1>Home Page</h1>
            <p>Welcome to the remote access platform to my personal server.</p>
            <p>Enjoy using my resources :p</p>
          </Show>
          <Show when={currentPage() === Pages.processes}>
            <h1>Procesess</h1>
            { loading() 
            ? <p>loading...</p>
            : <For each={items()}>
                {(item) => {
                  const task = () => data().get(item); // derived getter for reactivity
                  return (
                    <Processes
                      apiurl={API_URL}
                      item={item}
                      status={task()?.status ?? Status.Closed}
                    />
                  );
                }}
              </For>
            }
          </Show>

          <Show when={currentPage() === Pages.files}>
            <h1>File Browser</h1>
            <FileBrowser apiurl={API_URL}/>
          </Show>

          <Show when={currentPage() === Pages.misc}>
            <h1>Misc. controls</h1>
            <div class="misc-section">
              <div class="misc-item">
                <p class="misc-label">Shut down PC:</p>
                <button onClick={shutDown}>close</button>
              </div>

              <div class="misc-item">
                <p class="misc-label">Monitors:</p>
                <div class="monitor-buttons">
                  <button onClick={monitorOn}>on</button>
                  <button onClick={monitorOff}>off</button>
                </div>
              </div>
            </div>
          </Show>

        </div>
      </div>
    </div>
  );


  return (
    <div class="app">
      <header class={styles.header}>
        <button onclick={shutDown}>close</button>
        <br/>
        <p>monitors</p>
        <div style="padding-bottom: 0.5rem;">
          <button onclick={monitorOn}>on</button>
          <button onclick={monitorOff}>off</button>
        </div>
        <div>
          
        </div>
        
      </header>
    </div>
  );
};

export default App;
