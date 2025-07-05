# ==============================================================================
# КОНФИГУРАЦИЯ
# ==============================================================================

BUF_DIR := protos

BUF_ORG := vovilonn

BUF_REPO := learning

BUF_MODULE_NAME := buf.build/$(BUF_ORG)/$(BUF_REPO)

.PHONY: protogen help

protogen:
	@echo "\033[1;36m═══════════════════════════════════════════════\033[0m"
	@echo "\033[1;34m🔧  Генерация Protobuf-файлов...\033[0m"
	@echo "\033[1;36m═══════════════════════════════════════════════\033[0m"
	make clean-proto &&cd $(CURDIR)/$(BUF_DIR) && buf generate $(BUF_MODULE_NAME)
	@echo "\033[1;36m═══════════════════════════════════════════════\033[0m"
	@echo "\033[1;32m✅  Генерация завершена в $(BUF_DIR)/gen\033[0m"
	@echo "\033[1;36m═══════════════════════════════════════════════\033[0m"

clean-proto:
	rm -rf $(CURDIR)/$(BUF_DIR)/gen/*

help:
	@echo "\033[1;33mИспользование:\033[0m"
	@echo "  \033[1;32mmake protogen\033[0m - Генерация Protobuf-файлов"
	@echo "  \033[1;32mmake help\033[0m     - Показывает это сообщение"
	@echo "  \033[1;32mmake clean-proto\033[0m - Очистка Protobuf-файлов"