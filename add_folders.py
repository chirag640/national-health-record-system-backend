#!/usr/bin/env python3
"""
Generate comprehensive Postman collection folders for missing endpoints
"""

import json
import sys

# Load existing collection
with open('postman-collection.json', 'r') as f:
    collection = json.load(f)

print(f"Current folders: {len(collection['item'])}")

# NEW BILLING FOLDER
billing_folder = {
    "name": "Billing 💰",
    "item": [
        {
            "name": "Create Invoice",
            "event": [{
                "listen": "test",
                "script": {
                    "exec": [
                        "if (pm.response.code === 201) {",
                        "    const response = pm.response.json();",
                        "    if (response.data && response.data._id) {",
                        "        pm.collectionVariables.set('invoiceId', response.data._id);",
                        "        console.log('✅ Invoice created:', response.data._id);",
                        "    }",
                        "}"
                    ],
                    "type": "text/javascript"
                }
            }],
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": '{\n  "patientId": "{{patientId}}",\n  "hospitalId": "{{hospitalId}}",\n  "status": "draft",\n  "items": [{"description": "Consultation", "quantity": 1, "unitPrice": 500, "amount": 500}],\n  "subtotal": 500,\n  "taxAmount": 90,\n  "totalAmount": 590,\n  "currency": "INR"\n}'
                },
                "url": "{{baseUrl}}/billing/invoices"
            }
        },
        {
            "name": "Get All Invoices",
            "request": {
                "method": "GET",
                "url": "{{baseUrl}}/billing/invoices?page=1&limit=10"
            }
        },
        {
            "name": "Download Invoice PDF ⭐ (P0)",
            "request": {
                "method": "GET",
                "url": "{{baseUrl}}/billing/invoices/{{invoiceId}}/download",
                "description": "🎯 P0 CRITICAL: Professional invoice PDF with GST"
            }
        },
        {
            "name": "Create Payment",
            "event": [{
                "listen": "test",
                "script": {
                    "exec": [
                        "if (pm.response.code === 201) {",
                        "    const response = pm.response.json();",
                        "    if (response.data && response.data._id) {",
                        "        pm.collectionVariables.set('paymentId', response.data._id);",
                        "        console.log('✅ Payment created');",
                        "    }",
                        "}"
                    ],
                    "type": "text/javascript"
                }
            }],
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": '{\n  "invoiceId": "{{invoiceId}}",\n  "patientId": "{{patientId}}",\n  "amount": 590,\n  "currency": "INR",\n  "paymentMethod": "upi",\n  "status": "completed"\n}'
                },
                "url": "{{baseUrl}}/billing/payments"
            }
        },
        {
            "name": "Send Receipt Email ⭐ (P0)",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": '{\n  "email": "patient@example.com"\n}'
                },
                "url": "{{baseUrl}}/billing/payments/{{paymentId}}/send-receipt",
                "description": "🎯 P0 CRITICAL: Send HTML receipt email"
            }
        },
        {
            "name": "Get Payment Stats",
            "request": {
                "method": "GET",
                "url": "{{baseUrl}}/billing/stats"
            }
        }
    ]
}

# Add billing folder
collection['item'].append(billing_folder)
print("✅ Added Billing folder (6 key endpoints)")

# NEW APPOINTMENTS FOLDER
appointments_folder = {
    "name": "Appointments 📅",
    "item": [
        {
            "name": "Create Appointment ⭐",
            "event": [{
                "listen": "test",
                "script": {
                    "exec": [
                        "if (pm.response.code === 201) {",
                        "    pm.collectionVariables.set('appointmentId', pm.response.json().data?._id);",
                        "    console.log('✅ Appointment created');",
                        "}",
                        "if (pm.response.code === 409) {",
                        "    console.log('✅ P0: Overbooking prevented!');",
                        "}"
                    ],
                    "type": "text/javascript"
                }
            }],
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": '{\n  "patientId": "{{patientId}}",\n  "doctorId": "{{doctorId}}",\n  "startTime": "2025-12-15T10:00:00Z",\n  "endTime": "2025-12-15T10:30:00Z",\n  "type": "consultation",\n  "status": "scheduled"\n}'
                },
                "url": "{{baseUrlV1}}/appointments",
                "description": "🎯 P0 TEST: Try same time twice for overbooking test"
            }
        },
        {
            "name": "Get All Appointments",
            "request": {
                "method": "GET",
                "url": "{{baseUrlV1}}/appointments"
            }
        },
        {
            "name": "Check Availability",
            "request": {
                "method": "GET",
                "url": "{{baseUrlV1}}/appointments/availability?doctorId={{doctorId}}&date=2025-12-15"
            }
        }
    ]
}

collection['item'].append(appointments_folder)
print("✅ Added Appointments folder")

# NEW LAB REPORTS
lab_folder = {
    "name": "Lab Reports 🧪",
    "item": [
        {
            "name": "Create Lab Report",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": '{\n  "patientId": "{{patientId}}",\n  "testCategory": "blood",\n  "testName": "CBC",\n  "testDate": "2025-12-11T10:00:00Z",\n  "status": "completed",\n  "results": [{"parameterName": "Hemoglobin", "value": "14.5", "unit": "g/dL", "normalRange": "13-17", "status": "normal"}]\n}'
                },
                "url": "{{baseUrl}}/lab-reports"
            }
        },
        {
            "name": "Get Lab Reports",
            "request": {
                "method": "GET",
                "url": "{{baseUrl}}/lab-reports"
            }
        }
    ]
}

collection['item'].append(lab_folder)
print("✅ Added Lab Reports folder")

# NEW MEDICAL HISTORY
medical_folder = {
    "name": "Medical History 📋",
    "item": [
        {
            "name": "Create Allergy",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": '{\n  "patientId": "{{patientId}}",\n  "allergen": "Penicillin",\n  "type": "medication",\n  "severity": "severe",\n  "reaction": "Anaphylaxis"\n}'
                },
                "url": "{{baseUrl}}/medical-history/allergies"
            }
        },
        {
            "name": "Get Critical Allergies",
            "request": {
                "method": "GET",
                "url": "{{baseUrl}}/medical-history/allergies/patient/{{patientId}}/critical"
            }
        },
        {
            "name": "Record Vital Signs",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": '{\n  "patientId": "{{patientId}}",\n  "bloodPressure": {"systolic": 120, "diastolic": 80},\n  "heartRate": 72,\n  "temperature": 98.6\n}'
                },
                "url": "{{baseUrl}}/medical-history/vital-signs"
            }
        }
    ]
}

collection['item'].append(medical_folder)
print("✅ Added Medical History folder")

# NEW TELEMEDICINE
telemedicine_folder = {
    "name": "Telemedicine 📹",
    "item": [
        {
            "name": "Create Session",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": '{\n  "patientId": "{{patientId}}",\n  "doctorId": "{{doctorId}}",\n  "sessionType": "video",\n  "scheduledAt": "2025-12-15T14:00:00Z"\n}'
                },
                "url": "{{baseUrl}}/telemedicine"
            }
        },
        {
            "name": "Get All Sessions",
            "request": {
                "method": "GET",
                "url": "{{baseUrl}}/telemedicine"
            }
        }
    ]
}

collection['item'].append(telemedicine_folder)
print("✅ Added Telemedicine folder")

# Save
with open('postman-collection.json', 'w') as f:
    json.dump(collection, f, indent=2)

print(f"\n✨ COMPLETE! Total folders: {len(collection['item'])}")
print("✅ Postman collection updated successfully!")
