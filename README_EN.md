# gRPC Service Demo

A demonstration project showcasing microservices architecture using gRPC. The project consists of a Go server (gRPC backend) and a NestJS API Gateway.

## 🚀 What is gRPC and Protocol Buffers?

**gRPC** is a modern remote procedure call (RPC) framework developed by Google. It allows services to communicate with each other over HTTP/2, providing high performance, type safety, and bidirectional streaming data transfer.

**Protocol Buffers (protobuf)** is a language-independent data serialization format that replaces JSON/XML. Protobuf defines message and service structures in `.proto` files, from which code is automatically generated for different programming languages. This ensures strict typing, smaller message sizes, and faster serialization.

**Why do we need this?** In microservices architecture, services need to communicate with each other. gRPC + protobuf give us:

-   **Type Safety** - allows catching type errors at compile time and eliminates the need to write types manually - they are automatically generated from .proto files on both server and client sides
-   **Performance** - binary format is faster than JSON
-   **Auto-generated Code** - no need to write clients/servers manually
-   **Versioning** - clear control over API changes

## 🏗️ Project Architecture

```
grpc-service/
├── go-backend/          # Go gRPC server
├── nest-gateway/        # NestJS API Gateway
└── protos/             # Protobuf definitions (main repository)
```

### System Components:

1. **Go Backend** (`go-backend/`) - gRPC server in Go, implementing business logic
2. **NestJS Gateway** (`nest-gateway/`) - API Gateway in NestJS, providing REST API
3. **Protobuf Definitions** (`protos/`) - centralized API definitions in Protocol Buffers format

## 📋 Protobuf and BSR Workflow

### 1. Centralized API Management

All protobuf definitions are located in the `protos/` folder and published to **Buf Schema Registry (BSR)** under the name `buf.build/vovilonn/learning`.

### 2. Protobuf File Structure

```
protos/
├── buf.yaml           # BSR module configuration
├── Makefile          # BSR workflow commands
└── summ/
    └── v1/
        └── summ.proto # Summation service definition
```

**Example protobuf definition:**

```protobuf
syntax = "proto3";

package summ.v1;

service SummService {
    rpc Sum(SumRequest) returns (SumResponse);
}

message SumRequest {
    int32 a = 1;
    int32 b = 2;
}

message SumResponse {
    int32 result = 1;
}
```

### 3. Working with BSR (Buf Schema Registry)

#### Publishing to BSR:

```bash
cd protos/
make all  # Executes lint, breaking check and push
```

**What happens:**

-   `make lint` - checks protobuf file syntax and style
-   `make breaking` - checks for breaking changes
-   `make push` - publishes to BSR repository

#### Connecting to BSR:

Both projects (Go and NestJS) connect to BSR through `buf.yaml`:

```yaml
version: v2
deps:
    - buf.build/vovilonn/learning
```

### 4. Code Generation

#### Go Backend:

```bash
cd go-backend/
make protogen
```

**Generation configuration** (`protos/buf.gen.yaml`):

```yaml
version: v1
managed:
    enabled: true
    go_package_prefix:
        default: "gen"
plugins:
    - plugin: buf.build/protocolbuffers/go
      out: gen
      opt: paths=source_relative
    - plugin: buf.build/grpc/go
      out: gen
      opt: paths=source_relative,require_unimplemented_servers=false
```

#### NestJS Gateway:

```bash
cd nest-gateway/
yarn protogen
```

**Generation configuration** (`buf.gen.yaml`):

```yaml
version: v2
inputs:
    - directory: proto
plugins:
    - local: protoc-gen-ts_proto
      out: src/protos
      opt:
          - nestJs=true
          - useExactTypes=false
          - lowerCaseServiceMethods=false
          - snakeToCamel=true
```

## 🔄 Go Server and NestJS Integration

### 1. Go gRPC Server

**Main file:** `go-backend/cmd/api/main.go`

```go
func main() {
    // Logger setup
    logger, _ := zap.NewProduction()

    // Creating gRPC server with middleware
    server := grpc.NewServer(
        grpc.ChainUnaryInterceptor(
            grpc_zap.UnaryServerInterceptor(logger),
            grpc_recovery.UnaryServerInterceptor(),
        ),
    )

    // Service registration
    summService.Init(server)

    // Starting on port 5335
    listener, err := net.Listen("tcp", ":5335")
    server.Serve(listener)
}
```

**Service implementation:** `go-backend/internal/services/summ/summ.service.go`

```go
type summService struct {
    summv1.UnimplementedSummServiceServer
}

func (s *summService) Sum(ctx context.Context, params *summv1.SumRequest) (*summv1.SumResponse, error) {
    return &summv1.SumResponse{
        Result: params.A + params.B,
    }, nil
}
```

### 2. NestJS API Gateway

**gRPC client configuration:** `nest-gateway/src/summ/summ.module.ts`

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: ClientGRPC.SUMM_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: [SUMM_V1_PACKAGE_NAME],
          protoPath: '../protos/summ/v1/summ.proto',
          url: 'localhost:5335', // Connection to Go server
        },
      },
    ]),
  ],
  providers: [SummService],
  controllers: [SummController],
})
```

**Service for gRPC work:** `nest-gateway/src/summ/summ.service.ts`

```typescript
@Injectable()
export class SummService implements OnModuleInit {
    public grpc: SummServiceClient;

    constructor(@Inject(ClientGRPC.SUMM_SERVICE) private readonly client: ClientGrpc) {}

    async onModuleInit() {
        this.grpc = this.client.getService<SummServiceClient>(SUMM_SERVICE_NAME);
    }
}
```

**REST controller:** `nest-gateway/src/summ/summ.controller.ts`

```typescript
@Controller("summ")
export class SummController implements SummServiceController {
    constructor(private readonly summService: SummService) {}

    @Get("/")
    Sum(@Query() request: SummDto) {
        return this.summService.grpc.Sum(request); // Call to Go server
    }
}
```

### 3. Data Flow

1. **HTTP Request** → NestJS Gateway (`GET /summ?a=5&b=3`)
2. **Validation** → DTO converts query parameters to numbers
3. **gRPC Call** → NestJS calls Go server via gRPC
4. **Processing** → Go server performs addition
5. **Response** → Result returns through the entire chain

## 🚀 Setup Instructions

### Prerequisites

1. **Go** (version 1.24.4+)
2. **Node.js** (version 18+)
3. **Yarn** or npm
4. **Buf CLI** (`brew install bufbuild/buf/buf`)

### Step 1: Protobuf Preparation

```bash
# Navigate to protobuf definitions folder
cd protos/

# Check and publish to BSR (if needed)
make all

# Or separately:
make lint      # Syntax check
make breaking  # Breaking changes check
make push      # BSR publication
```

### Step 2: Go Server Startup

```bash
# Navigate to Go backend folder
cd go-backend/

# Generate Go code from protobuf
make protogen

# Start server
go run cmd/api/main.go
```

**Result:** Go gRPC server will start on port `:5335`

### Step 3: NestJS Gateway Startup

```bash
# In a new terminal, navigate to NestJS folder
cd nest-gateway/

# Install dependencies
yarn install

# Generate TypeScript code from protobuf
yarn protogen

# Start in development mode
yarn start:dev
```

**Result:** NestJS API Gateway will start on port `:3000`

### Step 4: Testing

```bash
# Test API via curl
curl "http://localhost:3000/summ?a=5&b=3"

# Expected response:
# {"result": 8}
```

## 📁 File Structure

### Go Backend

```
go-backend/
├── cmd/api/main.go              # Entry point
├── internal/services/summ/      # Business logic
├── protos/                      # Generated protobuf files
│   ├── buf.yaml                 # BSR configuration
│   ├── buf.gen.yaml            # Generation configuration
│   └── gen/                    # Generated Go code
└── Makefile                    # Protobuf workflow commands
```

### NestJS Gateway

```
nest-gateway/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # Main module
│   ├── summ/                   # Summation module
│   │   ├── summ.module.ts      # gRPC client configuration
│   │   ├── summ.service.ts     # Service for gRPC work
│   │   ├── summ.controller.ts  # REST controller
│   │   └── dto/                # Data Transfer Objects
│   ├── protos/                 # Generated protobuf files
│   └── constants.ts            # Constants
├── buf.gen.yaml               # Generation configuration
└── Makefile                   # Protobuf workflow commands
```

### Protobuf Definitions

```
protos/
├── buf.yaml                   # BSR module configuration
├── Makefile                   # BSR workflow commands
└── summ/v1/
    └── summ.proto            # API definition
```

## 🔧 Useful Commands

### Protobuf Workflow

```bash
# In protos/ folder
make lint      # Syntax check
make breaking  # Breaking changes check
make push      # BSR publication
make all       # All checks + publication
```

### Code Generation

```bash
# Go backend
cd go-backend/
make protogen

# NestJS gateway
cd nest-gateway/
yarn protogen
```

### Service Startup

```bash
# Go server
cd go-backend/
go run cmd/api/main.go

# NestJS gateway
cd nest-gateway/
yarn start:dev
```

## 🔍 Debugging

### gRPC Connection Check

```bash
# Install grpcurl
brew install grpcurl

# Direct testing of Go server
grpcurl -plaintext localhost:5335 list
grpcurl -plaintext -d '{"a": 5, "b": 3}' localhost:5335 summ.v1.SummService/Sum
```

### Logs

-   Go server uses `zap` for structured logging
-   NestJS uses built-in logger
-   All gRPC calls are logged automatically

## 📚 Additional Resources

-   [Buf Documentation](https://buf.build/docs)
-   [gRPC Documentation](https://grpc.io/docs/)
-   [NestJS Microservices](https://docs.nestjs.com/microservices/grpc)
-   [Protocol Buffers](https://developers.google.com/protocol-buffers)
