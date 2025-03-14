enum Status {
    Closed,
    Loading,
    Running,
    Served,
}
  
  
interface Task {
    name:string
    port:Number|null
    status:Status
}