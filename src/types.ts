export enum Status {
    Closed = "closed",
    Loading = "loading",
    Running = "running",
    Served = "served",
}
  
export interface Task {
    name:string
    port:number|null
    status:Status
}