BUF_DIR := src/protos

BUF_ORG := vovilonn

BUF_REPO := learning

BUF_MODULE_NAME := buf.build/$(BUF_ORG)/$(BUF_REPO)

.PHONY: clean-proto protogen help

clean-proto:
	rm -rf $(BUF_DIR)/*

protogen:
	@echo "\033[1;36m═══════════════════════════════════════════════\033[0m"
	@echo "\033[1;34m🔧  Генерация Protobuf-файлов...\033[0m"
	@echo "\033[1;36m═══════════════════════════════════════════════\033[0m"
	make clean-proto && buf export $(BUF_MODULE_NAME) --output $(BUF_DIR) && buf generate $(BUF_MODULE_NAME)
	@echo "\033[1;36m═══════════════════════════════════════════════\033[0m"
	@echo "\033[1;32m✅  Генерация завершена в $(BUF_DIR)/gen\033[0m"
	@echo "\033[1;36m═══════════════════════════════════════════════\033[0m"

help:
	@echo "\033[1;33mИспользование:\033[0m"
	@echo "  \033[1;32mmake protogen (запускать через yarn protogen)\033[0m - Генерация Protobuf-файлов"
	@echo "  \033[1;32mmake clean-proto (запускать через yarn clean-proto)\033[0m - Очистка Protobuf-файлов"
	@echo "  \033[1;32mmake help\033[0m     - Показывает это сообщение"