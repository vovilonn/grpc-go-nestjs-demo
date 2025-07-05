# gRPC Service Demo

Демонстрационный проект, показывающий архитектуру микросервисов с использованием gRPC. Проект состоит из Go-сервера (gRPC backend) и NestJS API Gateway.

## 🚀 Что такое gRPC и Protocol Buffers?

**gRPC** - это современный фреймворк для удаленного вызова процедур (RPC), разработанный Google. Он позволяет сервисам общаться друг с другом через HTTP/2, обеспечивая высокую производительность, типобезопасность и двунаправленную потоковую передачу данных.

**Protocol Buffers (protobuf)** - это язык-независимый формат сериализации данных, который заменяет JSON/XML. Protobuf определяет структуру сообщений и сервисов в `.proto` файлах, из которых автоматически генерируется код для разных языков программирования. Это обеспечивает строгую типизацию, меньший размер сообщений и более быструю сериализацию.

**Зачем это нужно?** В микросервисной архитектуре сервисы должны общаться между собой. gRPC + protobuf дают нам:

-   **Типобезопасность** - позволяет получить ошибки типов на этапе компиляции и не нужно писать типы вручную - они автоматически генерируются из .proto файла как на стороне сервера, так и на стороне клиента
-   **Производительность** - бинарный формат быстрее JSON
-   **Автогенерация кода** - не нужно писать клиенты/серверы вручную
-   **Версионирование** - четкий контроль изменений API

## 🏗️ Архитектура проекта

```
grpc-service/
├── go-backend/          # Go gRPC сервер
├── nest-gateway/        # NestJS API Gateway
└── protos/             # Protobuf определения (основной репозиторий)
```

### Компоненты системы:

1. **Go Backend** (`go-backend/`) - gRPC сервер на Go, реализующий бизнес-логику
2. **NestJS Gateway** (`nest-gateway/`) - API Gateway на NestJS, предоставляющий REST API
3. **Protobuf Definitions** (`protos/`) - централизованные определения API в формате Protocol Buffers

## 📋 Описание работы с Protobuf и BSR

### 1. Централизованное управление API

Все protobuf определения находятся в папке `protos/` и публикуются в **Buf Schema Registry (BSR)** под именем `buf.build/vovilonn/learning`.

### 2. Структура protobuf файлов

```
protos/
├── buf.yaml           # Конфигурация BSR модуля
├── Makefile          # Команды для работы с BSR
└── summ/
    └── v1/
        └── summ.proto # Определение сервиса суммирования
```

**Пример protobuf определения:**

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

### 3. Работа с BSR (Buf Schema Registry)

#### Публикация в BSR:

```bash
cd protos/
make all  # Выполняет lint, breaking check и push
```

**Что происходит:**

-   `make lint` - проверяет синтаксис и стиль protobuf файлов
-   `make breaking` - проверяет на ломающие изменения
-   `make push` - публикует в BSR репозиторий

#### Подключение к BSR:

Оба проекта (Go и NestJS) подключаются к BSR через `buf.yaml`:

```yaml
version: v2
deps:
    - buf.build/vovilonn/learning
```

### 4. Генерация кода

#### Go Backend:

```bash
cd go-backend/
make protogen
```

**Конфигурация генерации** (`protos/buf.gen.yaml`):

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

**Конфигурация генерации** (`buf.gen.yaml`):

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

## 🔄 Связка Go сервера с NestJS

### 1. Go gRPC сервер

**Основной файл:** `go-backend/cmd/api/main.go`

```go
func main() {
    // Настройка логгера
    logger, _ := zap.NewProduction()

    // Создание gRPC сервера с middleware
    server := grpc.NewServer(
        grpc.ChainUnaryInterceptor(
            grpc_zap.UnaryServerInterceptor(logger),
            grpc_recovery.UnaryServerInterceptor(),
        ),
    )

    // Регистрация сервиса
    summService.Init(server)

    // Запуск на порту 5335
    listener, err := net.Listen("tcp", ":5335")
    server.Serve(listener)
}
```

**Реализация сервиса:** `go-backend/internal/services/summ/summ.service.go`

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

**Конфигурация gRPC клиента:** `nest-gateway/src/summ/summ.module.ts`

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
          url: 'localhost:5335', // Подключение к Go серверу
        },
      },
    ]),
  ],
  providers: [SummService],
  controllers: [SummController],
})
```

**Сервис для работы с gRPC:** `nest-gateway/src/summ/summ.service.ts`

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

**REST контроллер:** `nest-gateway/src/summ/summ.controller.ts`

```typescript
@Controller("summ")
export class SummController implements SummServiceController {
    constructor(private readonly summService: SummService) {}

    @Get("/")
    Sum(@Query() request: SummDto) {
        return this.summService.grpc.Sum(request); // Вызов Go сервера
    }
}
```

### 3. Поток данных

1. **HTTP запрос** → NestJS Gateway (`GET /summ?a=5&b=3`)
2. **Валидация** → DTO преобразует query параметры в числа
3. **gRPC вызов** → NestJS вызывает Go сервер через gRPC
4. **Обработка** → Go сервер выполняет сложение
5. **Ответ** → Результат возвращается через всю цепочку

## 🚀 Инструкция по запуску

### Предварительные требования

1. **Go** (версия 1.24.4+)
2. **Node.js** (версия 18+)
3. **Yarn** или npm
4. **Buf CLI** (`brew install bufbuild/buf/buf`)

### Шаг 1: Подготовка protobuf

```bash
# Переходим в папку с protobuf определениями
cd protos/

# Проверяем и публикуем в BSR (если нужно)
make all

# Или по отдельности:
make lint      # Проверка синтаксиса
make breaking  # Проверка на ломающие изменения
make push      # Публикация в BSR
```

### Шаг 2: Запуск Go сервера

```bash
# Переходим в папку Go backend
cd go-backend/

# Генерируем Go код из protobuf
make protogen

# Запускаем сервер
go run cmd/api/main.go
```

**Результат:** Go gRPC сервер запустится на порту `:5335`

### Шаг 3: Запуск NestJS Gateway

```bash
# В новом терминале переходим в папку NestJS
cd nest-gateway/

# Устанавливаем зависимости
yarn install

# Генерируем TypeScript код из protobuf
yarn protogen

# Запускаем в режиме разработки
yarn start:dev
```

**Результат:** NestJS API Gateway запустится на порту `:3000`

### Шаг 4: Тестирование

```bash
# Тестируем API через curl
curl "http://localhost:3000/summ?a=5&b=3"

# Ожидаемый ответ:
# {"result": 8}
```

## 📁 Структура файлов

### Go Backend

```
go-backend/
├── cmd/api/main.go              # Точка входа
├── internal/services/summ/      # Бизнес-логика
├── protos/                      # Сгенерированные protobuf файлы
│   ├── buf.yaml                 # Конфигурация BSR
│   ├── buf.gen.yaml            # Конфигурация генерации
│   └── gen/                    # Сгенерированный Go код
└── Makefile                    # Команды для работы с protobuf
```

### NestJS Gateway

```
nest-gateway/
├── src/
│   ├── main.ts                 # Точка входа
│   ├── app.module.ts           # Главный модуль
│   ├── summ/                   # Модуль суммирования
│   │   ├── summ.module.ts      # Конфигурация gRPC клиента
│   │   ├── summ.service.ts     # Сервис для работы с gRPC
│   │   ├── summ.controller.ts  # REST контроллер
│   │   └── dto/                # Data Transfer Objects
│   ├── protos/                 # Сгенерированные protobuf файлы
│   └── constants.ts            # Константы
├── buf.gen.yaml               # Конфигурация генерации
└── Makefile                   # Команды для работы с protobuf
```

### Protobuf Definitions

```
protos/
├── buf.yaml                   # Конфигурация BSR модуля
├── Makefile                   # Команды для работы с BSR
└── summ/v1/
    └── summ.proto            # Определение API
```

## 🔧 Полезные команды

### Работа с protobuf

```bash
# В папке protos/
make lint      # Проверка синтаксиса
make breaking  # Проверка на ломающие изменения
make push      # Публикация в BSR
make all       # Все проверки + публикация
```

### Генерация кода

```bash
# Go backend
cd go-backend/
make protogen

# NestJS gateway
cd nest-gateway/
yarn protogen
```

### Запуск сервисов

```bash
# Go сервер
cd go-backend/
go run cmd/api/main.go

# NestJS gateway
cd nest-gateway/
yarn start:dev
```

## 🔍 Отладка

### Проверка gRPC соединения

```bash
# Установка grpcurl
brew install grpcurl

# Тестирование Go сервера напрямую
grpcurl -plaintext localhost:5335 list
grpcurl -plaintext -d '{"a": 5, "b": 3}' localhost:5335 summ.v1.SummService/Sum
```

### Логи

-   Go сервер использует `zap` для структурированного логирования
-   NestJS использует встроенный логгер
-   Все gRPC вызовы логируются автоматически

## 📚 Дополнительные ресурсы

-   [Buf Documentation](https://buf.build/docs)
-   [gRPC Documentation](https://grpc.io/docs/)
-   [NestJS Microservices](https://docs.nestjs.com/microservices/grpc)
-   [Protocol Buffers](https://developers.google.com/protocol-buffers)
