
## 1. Overview

A very simple showcase about using grpc:

`listener.cc`: "server" used for listenning request from client
`request.go`: the "client"

## 2. Usage

### 2.1 Generate pb files

```bash
make rpc
```

### 2.2 Generate listener

```bash
make
```

### 2.3 Send request

```go
go run requester.go
```

