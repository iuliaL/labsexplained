# API Documentation

## Authentication Endpoints

### Login
- **POST** `/auth/login`
- **Description**: Authenticates a user and returns a JWT token
- **Request Body**:
```json
{
    "email": "string",
    "password": "string"
}
```
- **Response**:
```json
{
    "message": "Login successful",
    "token": "string",
    "token_type": "Bearer",
    "fhir_id": "string",
    "role": "admin" | "patient"
}
```

### Check Email
- **GET** `/auth/check-email?email={email}`
- **Description**: Checks if a patient exists by email
- **Response**:
```json
{
    "message": "string",
    "exists": boolean
}
```

### Forgot Password
- **POST** `/auth/forgot-password`
- **Description**: Initiates password reset process
- **Request Body**:
```json
{
    "email": "string"
}
```

### Reset Password
- **POST** `/auth/reset-password`
- **Description**: Resets password using reset token
- **Request Body**:
```json
{
    "token": "string",
    "new_password": "string"
}
```

### Assign Admin Role
- **PUT** `/auth/assign-admin?email={email}`
- **Description**: Assigns admin role to a user (admin only)
- **Headers**: `Authorization: Bearer {token}`

## Patient Endpoints

### Register Patient
- **POST** `/patients`
- **Description**: Registers a new patient
- **Request Body**:
```json
{
    "first_name": "string",
    "last_name": "string",
    "birth_date": "string",
    "gender": "male" | "female" | "other" | "unknown",
    "email": "string",
    "password": "string",
    "is_admin": boolean
}
```

### Get All Patients
- **GET** `/patients?page={page}&page_size={page_size}`
- **Description**: Retrieves paginated list of patients (admin only)
- **Headers**: `Authorization: Bearer {token}`

### Get Patient
- **GET** `/patients/{fhir_id}?include_observations={boolean}`
- **Description**: Retrieves patient details
- **Headers**: `Authorization: Bearer {token}`

### Delete Patient
- **DELETE** `/patients/{fhir_id}`
- **Description**: Deletes a patient and all associated data (admin only)
- **Headers**: `Authorization: Bearer {token}`

## Lab Results Endpoints

### Get Lab Test Sets
- **GET** `/lab_set/{patient_fhir_id}?include_observations={boolean}&page={page}&page_size={page_size}`
- **Description**: Retrieves paginated lab test sets for a patient
- **Headers**: `Authorization: Bearer {token}`

### Upload Lab Test Set
- **POST** `/lab_set`
- **Description**: Uploads and processes a lab test set
- **Form Data**:
  - `patient_fhir_id`: string
  - `test_date`: string
  - `file`: file (PDF or image)

### Delete Lab Test Set
- **DELETE** `/lab_set/{lab_test_set_id}`
- **Description**: Deletes a lab test set and its observations
- **Headers**: `Authorization: Bearer {token}`

### Interpret Lab Test Set
- **POST** `/lab_set/{lab_test_set_id}/interpret`
- **Description**: Generates AI interpretation for a lab test set
- **Headers**: `Authorization: Bearer {token}`

### Get Observation
- **GET** `/observations/{observation_id}`
- **Description**: Retrieves a specific observation
- **Headers**: `Authorization: Bearer {token}`

### Delete Observation
- **DELETE** `/observations/{observation_id}`
- **Description**: Deletes a specific observation
- **Headers**: `Authorization: Bearer {token}`

### Delete All Patient Observations
- **DELETE** `/observations/patient/{patient_fhir_id}`
- **Description**: Deletes all observations for a patient
- **Headers**: `Authorization: Bearer {token}` 