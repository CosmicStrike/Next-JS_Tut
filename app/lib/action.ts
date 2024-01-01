'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: "Please select a customer"
    }),
    amount: z.coerce.number()
        .gt(0, { message: "Please enter the amount greater then $0" }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: "Please select invoice status"
    }),
    date: z.string()
});

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ date: true });

export async function createInvoice(prevState: State, formData: FormData) {
    // Validate form using Zod
    // console.log(formData);
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    // console.log("Validate Fields ; ", validatedFields)
    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        // console.log("Errors : ", validatedFields.error.flatten().fieldErrors,)
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    // console.log("Data : ", validatedFields.data);
    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert data into the database
    try {
        await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        // If a database error occurs, return a more specific error.
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(cid: string, prevState: State, formData: FormData) {
    const validatedFields = UpdateInvoice.safeParse({
        id: cid,
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    // console.log(formData);
    if (!validatedFields.success) {
        // console.log("Errors : ", validatedFields.error.flatten().fieldErrors,)
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            // validateFields.error => gives the error object contain all errors
            // flatten => will convert the complex structure of object to simple one
            // fieldErrors => give the array of object with field name as key and arrat of string as err-message
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    const { id, customerId, amount, status } = validatedFields.data;
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
    // revalidatePath('dashboard/invoices');
    redirect('/dashboard/invoices');
    return { message: "Successful to update a invoice" }
}

export async function deleteInvoice(id: string) {

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