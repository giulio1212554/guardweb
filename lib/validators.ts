import { z } from "zod";

export const domainSchema = z
  .string()
  .min(1, "Dominio obbligatorio")
  .max(253, "Dominio troppo lungo")
  .regex(
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    "Formato dominio non valido (es. esempio.it)"
  )
  .transform((v) => v.toLowerCase().trim());

export const demoCodeSchema = z
  .string()
  .regex(/^GW-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, "Formato codice: GW-XXXX-XXXX");

export type DomainInput = z.infer<typeof domainSchema>;
