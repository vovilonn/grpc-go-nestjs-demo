# ==============================================================================
# КОНФИГУРАЦИЯ
# ==============================================================================

BUF_ORG := vovilonn

BUF_REPO := learning

BUF_MODULE_NAME := buf.build/$(BUF_ORG)/$(BUF_REPO)

# ==============================================================================
# ЦЕЛИ MAKEFILE
# ==============================================================================

.PHONY: all lint breaking push

# Цель по умолчанию: выполнить все проверки и запушить
all: lint breaking push

# Проверяет Protobuf-файлы на ошибки линтинга
lint:
	@echo "--- Запуск buf lint ---"
	buf lint
	@echo "--- buf lint завершен успешно ---"

# Проверяет Protobuf-файлы на ломающие изменения
# Сравнивает с последней версией, запушенной в buf.build
breaking:
	@echo "--- Запуск buf breaking (сравнение с $(BUF_MODULE_NAME):main) ---"
	buf breaking --against-registry '$(BUF_MODULE_NAME):main'
	@echo "--- buf breaking завершен успешно ---"

# Пушит Protobuf-файлы в buf.build
push:
	@echo "--- Запуск buf push ---"
	buf push
	@echo "--- buf push завершен успешно ---"

# ==============================================================================
# ПОМОЩЬ
# ==============================================================================

help:
	@echo "Использование:"
	@echo "  make all      - Выполняет lint, breaking и push"
	@echo "  make lint     - Проверяет Protobuf-файлы на ошибки линта"
	@echo "  make breaking - Проверяет на ломающие изменения, сравнивая с buf.build"
	@echo "  make push     - Пушит Protobuf-файлы в buf.build репозиторий"
	@echo "  make help     - Показывает это сообщение"