package summService

import (
	"context"
	summv1 "main/protos/gen/summ/v1"

	"google.golang.org/grpc"
)

type summService struct {
	summv1.UnimplementedSummServiceServer
}

func (s *summService) Sum(ctx context.Context, params *summv1.SumRequest) (*summv1.SumResponse, error) {
	return &summv1.SumResponse{
		Result: params.A + params.B,
	}, nil
}

func Init(server *grpc.Server) {
	summv1.RegisterSummServiceServer(server, &summService{})
}
