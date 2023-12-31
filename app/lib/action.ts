'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export default async function createInvoice(formData: FormData) {


    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    // console.log(date);

    try {
        await sql
            `INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    }
    catch (err) {
        console.log(err);
        return { message: "Falied to create a new invoice" };
    }
    // revalidatePath('/dashboard/invoices');
    // redirect('/dashboard/invoices');
    return { message: "Successful to create a new invoice" }
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    try {

        await sql`UPDATE invoices 
    SET customer_id = ${customerId}, amount = ${amountInCents}, status= ${status}
    WHERE id=${id};`
    }
    catch (err) {
        console.log(err);
        return { message: "Falied to update a invoice" };
    }
    revalidatePath('dashboard/invoices');
    // redirect('/dashboard/invoices');
    return { message: "Successful to update a invoice" }
}

export async function deleteInvoice(id: string) {
    throw new Error("failed to delete invoice");
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;

    }
    catch (err) {
        console.log(err);
        return { message: "Falied to delete a invoice" };
    }
    revalidatePath('/dashboard/invoices');
    return { message: "Successful to delete the invoice" };
}