import React, { useEffect, useState } from "react";
import { adminService } from "../services/admin";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  fhir_id: string;
}

export function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await adminService.getPatients();
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Patient Dashboard</h1>

      <div className="grid gap-6">
        {patients.map((patient) => (
          <div key={patient.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {patient.first_name} {patient.last_name}
                </h2>
                <p className="text-sm text-slate-500">Born: {new Date(patient.birth_date).toLocaleDateString()}</p>
                <p className="text-sm text-slate-500">
                  Gender: {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                </p>
                <p className="text-sm text-slate-500">FHIR ID: {patient.fhir_id}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
