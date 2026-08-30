import { DemoCustomer } from "../types/contracts";
import { DEMO_CUSTOMERS } from "../mocks/customers";

export interface LoginPayload {
  name: string;
  mobile_number: string;
}

export async function loginCustomer(payload: LoginPayload): Promise<{ status: string; customer: DemoCustomer }> {
  // Simulate network latency for realistic banking experience
  await new Promise((resolve) => setTimeout(resolve, 300));

  const cleanPhone = payload.mobile_number.replace(/\D/g, "");

  // Match existing customer if phone matches last digits, otherwise create custom demo customer profile
  const matched = DEMO_CUSTOMERS.find(
    (c) => c.phone.replace(/\D/g, "").includes(cleanPhone) || c.name.toLowerCase() === payload.name.trim().toLowerCase()
  );

  if (matched) {
    return {
      status: "success",
      customer: matched,
    };
  }

  // Generate customized existing customer profile for new logins
  const customCustomer: DemoCustomer = {
    id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    name: payload.name.trim(),
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    email: `${payload.name.trim().toLowerCase().replace(/\s+/g, ".")}@example.com`,
    phone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`,
    employment_type: "Salaried",
    employer: "Prime Enterprise Services",
    monthly_income: 125000,
    existing_emi: 10000,
    credit_band: "Excellent (780+)",
    cibil_score: 785,
    relationship_years: 3.5,
    account_type: "Salary Advantage Tier-1",
    default_intent: "Home Loan",
    default_loan_amount: 5000000,
  };

  return {
    status: "success",
    customer: customCustomer,
  };
}

export interface EmployeeLoginPayload {
  username: string;
  password: string;
}

export interface EmployeeLoginResponse {
  status: string;
  role: "employee";
  username: string;
}

export async function loginEmployee(payload: EmployeeLoginPayload): Promise<EmployeeLoginResponse> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (payload.username.trim() === "bankemployee" && payload.password === "Demo@123") {
    return {
      status: "success",
      role: "employee",
      username: "bankemployee",
    };
  }

  throw new Error("Invalid employee username or password.");
}
