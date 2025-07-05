package main

import (
	"context"
	summService "main/internal/services/summ"

	"net"

	grpc_zap "github.com/grpc-ecosystem/go-grpc-middleware/logging/zap"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"go.uber.org/zap"
)

func main() {

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	grpc_zap.ReplaceGrpcLoggerV2(logger)

	panicHandler := func(ctx context.Context, p interface{}) error {
		logger.Error("panic recovered", zap.Any("panic", p))
		return status.Errorf(codes.Internal, "internal server error")
	}

	server := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			grpc_zap.UnaryServerInterceptor(logger),
			grpc_recovery.UnaryServerInterceptor(
				grpc_recovery.WithRecoveryHandlerContext(panicHandler),
			),
		),
	)

	summService.Init(server)

	listener, err := net.Listen("tcp", ":5335")

	if err != nil {
		logger.Fatal("failed to listen", zap.Error(err))
	}

	logger.Info("gRPC server started", zap.String("addr", ":5335"))

	err = server.Serve(listener)

	if err != nil {
		logger.Fatal("failed to serve", zap.Error(err))
	}

	logger.Info("gRPC server stopped")

}
