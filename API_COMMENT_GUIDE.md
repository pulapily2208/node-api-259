# API Comment - Hướng dẫn sử dụng Postman

## 1. Lấy danh sách bình luận theo sản phẩm

**Endpoint:** `GET /api/products/:id/comments`

**URL:** `http://localhost:3000/api/products/{product_id}/comments`

**Query Parameters:**
- `status` (optional): `pending` hoặc `approved` (mặc định: `approved`)
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số item/trang (mặc định: 10)
- `sort` (optional): `true` để sắp xếp tăng dần

**Ví dụ:**
```
GET http://localhost:3000/api/products/507f1f77bcf86cd799439011/comments?status=approved&page=1&limit=10
```

**Response:**
```json
{
  "status": "success",
  "message": "Get comments successfully",
  "data": [
    {
      "_id": "673280c4c208c87a8c7fc1c0",
      "product_id": "507f1f77bcf86cd799439011",
      "name": "Nguyễn Văn A",
      "email": "user@example.com",
      "content": "Sản phẩm rất tốt, tôi rất hài lòng!",
      "status": "approved",
      "createdAt": "2024-11-11T10:30:00.000Z",
      "updatedAt": "2024-11-11T10:30:00.000Z"
    }
  ],
  "pages": {
    "current": 1,
    "total": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 2. Tạo bình luận mới

**Endpoint:** `POST /api/products/:id/comments`

**URL:** `http://localhost:3000/api/products/{product_id}/comments`

**Headers:**
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "name": "Nguyễn Văn B",
  "email": "user@example.com",
  "content": "Đây là bình luận của tôi về sản phẩm này"
}
```

**Lưu ý:**
- Nội dung có từ thô tục sẽ **tự động được lọc thành dấu `*`**
- Ví dụ: "Sản phẩm đcm tốt" → "Sản phẩm *** tốt"
- Trạng thái mặc định là `pending` (chờ duyệt)

**Response:**
```json
{
  "status": "success",
  "message": "Comment created successfully (Profanity filtered)",
  "data": {
    "_id": "673280c4c208c87a8c7fc1c1",
    "product_id": "507f1f77bcf86cd799439011",
    "name": "Nguyễn Văn B",
    "email": "user@example.com",
    "content": "Đây là bình luận của tôi về sản phẩm này",
    "status": "pending",
    "createdAt": "2024-11-11T11:00:00.000Z",
    "updatedAt": "2024-11-11T11:00:00.000Z"
  }
}
```

---

## 3. Cập nhật trạng thái bình luận (Admin)

**Endpoint:** `PATCH /api/comments/:id/status`

**URL:** `http://localhost:3000/api/comments/{comment_id}/status`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {access_token}` (yêu cầu đăng nhập)

**Body (JSON):**
```json
{
  "status": "approved"
}
```

**Trạng thái hợp lệ:**
- `pending` - Chờ duyệt
- `approved` - Đã duyệt (hiển thị công khai)

**Response:**
```json
{
  "status": "success",
  "message": "Comment status updated to approved successfully",
  "data": {
    "_id": "673280c4c208c87a8c7fc1c1",
    "product_id": "507f1f77bcf86cd799439011",
    "name": "Nguyễn Văn B",
    "email": "user@example.com",
    "content": "Đây là bình luận của tôi về sản phẩm này",
    "status": "approved",
    "createdAt": "2024-11-11T11:00:00.000Z",
    "updatedAt": "2024-11-11T11:05:00.000Z"
  }
}
```

---

## 4. Xóa bình luận (Admin)

**Endpoint:** `DELETE /api/comments/:id`

**URL:** `http://localhost:3000/api/comments/{comment_id}`

**Headers:**
- `Authorization: Bearer {access_token}` (yêu cầu đăng nhập)

**Response:**
```json
{
  "status": "success",
  "message": "Comment deleted successfully",
  "data": {
    "_id": "673280c4c208c87a8c7fc1c1",
    "product_id": "507f1f77bcf86cd799439011",
    "name": "Nguyễn Văn B",
    "email": "user@example.com",
    "content": "Đây là bình luận của tôi về sản phẩm này",
    "status": "approved"
  }
}
```

---

## Danh sách từ bị lọc

Các từ sau sẽ tự động được thay thế bằng dấu `*`:
- đcm → ***
- đm → **
- cmm → ***
- cc → **
- shit → ****
- cút → ***
- mm → **
- fuck → ****
- đéo → ***
- lồn → ***
- địt → ***
- chó → ***
- bitch → *****
- damn → ****

---

## Lấy Access Token (để dùng cho API Admin)

**Endpoint:** `POST /api/auth/users/login`

**URL:** `http://localhost:3000/api/auth/users/login`

**Body (JSON):**
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "email": "admin@example.com",
      "name": "Admin"
    }
  }
}
```

Sau đó copy `accessToken` và dùng trong header `Authorization: Bearer {accessToken}`

---

## Lưu ý quan trọng

1. **Thêm bình luận mới**: Chỉ qua API, không qua web admin
2. **Xem bình luận**: Qua web admin tại `/admin/comments`
3. **Quản lý trạng thái**: Qua web admin hoặc API
4. **Từ thô tục**: Tự động lọc thành `*` khi tạo
5. **Hiển thị**: Nội dung đã lọc hiển thị trong admin panel

---

## Test với Postman Collection

Import collection này vào Postman:

```json
{
  "info": {
    "name": "Node API - Comments",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Comments by Product",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/products/{{product_id}}/comments?status=approved&page=1&limit=10",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "products", "{{product_id}}", "comments"],
          "query": [
            {"key": "status", "value": "approved"},
            {"key": "page", "value": "1"},
            {"key": "limit", "value": "10"}
          ]
        }
      }
    },
    {
      "name": "Create Comment",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Nguyễn Văn A\",\n  \"email\": \"user@example.com\",\n  \"content\": \"Sản phẩm rất tốt!\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/products/{{product_id}}/comments",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "products", "{{product_id}}", "comments"]
        }
      }
    },
    {
      "name": "Update Comment Status",
      "request": {
        "method": "PATCH",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "Authorization", "value": "Bearer {{access_token}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"status\": \"approved\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/comments/{{comment_id}}/status",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "comments", "{{comment_id}}", "status"]
        }
      }
    },
    {
      "name": "Delete Comment",
      "request": {
        "method": "DELETE",
        "header": [
          {"key": "Authorization", "value": "Bearer {{access_token}}"}
        ],
        "url": {
          "raw": "http://localhost:3000/api/comments/{{comment_id}}",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "comments", "{{comment_id}}"]
        }
      }
    }
  ]
}
```
