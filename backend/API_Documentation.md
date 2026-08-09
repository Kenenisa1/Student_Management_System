# API Test

Now your backend supports:

## Create Request
1. CREATE Student
Method POST
`http://localhost:5000/api/students`

Body:
```bash
{
    "name":"Getachew",
    "email":"getachew@gmail.com",
    "department":"Computer Engineering"
}
```

Response:
```bash 
{
    "success":true,
    "message":"Student created successfully",
    "id":1
}
```

## Read (Get) Request
2. GET All Students
Method: GET
`http://localhost:5000/api/students`

Response:
```bash
{
 "success":true,
 "data":[
    {
       "id":1,
       "name":"Getachew",
       "email":"getachew@gmail.com",
       "department":"Computer Engineering"
    }
 ]
}
```
3. GET Student By ID
GET
` http://localhost:5000/api/students/1 `

Response:
```bash
{
"id":1,
"name":"Getachew",
"email":"getachew@gmail.com",
"department":"Computer Engineering"
}
```

## Update Data
4. UPDATE Student
PUT
`http://localhost:5000/api/students/1`

```bash
Body:

{
    "name":"Abebe",
    "email":"abebe@gmail.com",
    "department":"Software Engineering"
}
```
Response:

```bash
{
    "message":"Student updated successfully"
}
```

## Delate Data
5. DELETE Student
DELETE
``http://localhost:5000/api/students/1``

Response:

```bash
{
    "message":"Student deleted successfully"
}
Complete Architecture Now
                 Postman / Frontend

                         |
                         |
                         ↓

                 studentRoutes.js

                         |
                         |
                         ↓

              studentController.js

                         |
                         |
                         ↓

                studentModel.js

                         |
                         |
                         ↓

                  MySQL Database

 ```                 