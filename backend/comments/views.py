from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


def not_implemented():
    return Response({"detail": "Not implemented"}, status=status.HTTP_501_NOT_IMPLEMENTED)

class CommentListCreateView(APIView):
    def get(self, request, **kwargs):
        return not_implemented()

    def post(self, request, **kwargs):
        return not_implemented()


class CommentDeleteView(APIView):
    def delete(self, request, **kwargs):
        return not_implemented()
