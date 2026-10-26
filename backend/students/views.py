
from rest_framework import viewsets
from .models import Student
from .serializers import StudentSerializer
import openpyxl
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by("-id")
    serializer_class = StudentSerializer

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def import_students_excel(request):
    excel_file = request.FILES.get("file")

    if not excel_file:
        return Response(
            {"error": "Please upload an Excel file using the 'file' field."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        workbook = openpyxl.load_workbook(
            excel_file,
            read_only=True,
            data_only=True
        )
        sheet = workbook.active

        # First row must contain column headings.
        rows = sheet.iter_rows(values_only=True)
        headers = next(rows, None)

        if not headers:
            return Response(
                {"error": "The Excel file is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        headers = [
            str(value).strip().lower().replace(" ", "_")
            if value is not None else ""
            for value in headers
        ]

        required = [
            "name", "phone", "email", "course",
            "joining_date", "fee_status"
        ]

        missing = [column for column in required if column not in headers]

        if missing:
            return Response(
                {"error": f"Missing columns: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        column_index = {name: headers.index(name) for name in required}
        created = 0
        errors = []

        for row_number, row in enumerate(rows, start=2):
            try:
                def cell(column):
                    index = column_index[column]
                    return row[index] if index < len(row) else None

                name = str(cell("name") or "").strip()
                phone = str(cell("phone") or "").strip()
                email = str(cell("email") or "").strip()
                course = str(cell("course") or "").strip()
                joining_date = cell("joining_date")
                fee_status = str(cell("fee_status") or "Pending").strip().title()

                if not all([name, phone, course, joining_date]):
                    raise ValueError(
                        "Name, phone, course, and joining_date are required."
                    )

                if isinstance(joining_date, datetime):
                    joining_date = joining_date.date()
                elif hasattr(joining_date, "year") and hasattr(joining_date, "month"):
                    pass
                else:
                    joining_date = datetime.strptime(
                        str(joining_date).strip(), "%Y-%m-%d"
                    ).date()

                if fee_status not in ["Paid", "Pending", "Partial"]:
                    raise ValueError(
                        "fee_status must be Paid, Pending, or Partial."
                    )

                student = Student(
                    name=name,
                    phone=phone,
                    email=email,
                    course=course,
                    joining_date=joining_date,
                    fee_status=fee_status,
                )
                student.full_clean()
                student.save()
                created += 1

            except Exception as exc:
                errors.append({
                    "row": row_number,
                    "error": str(exc)
                })

        workbook.close()

        return Response({
            "message": f"Imported {created} student(s).",
            "created": created,
            "errors": errors
        }, status=status.HTTP_200_OK)

    except Exception as exc:
        return Response(
            {"error": f"Could not read Excel file: {str(exc)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
