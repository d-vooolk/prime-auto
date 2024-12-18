import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        // Получаем данные из тела запроса
        const { name, phone, comment, agreement } = await req.json();

        // Настройка транспортера для отправки писем через SMTP
        const transporter = nodemailer.createTransport({
            host: 'smtp.beget.com',
            port: 465,
            secure: true,
            auth: {
                user: 'info@prime-auto.by',
                pass: '82Ehedub!',
            },
        });

        // Формируем письмо
        const mailOptions = {
            from: 'info@prime-auto.by',
            to: 'info@prime-auto.by',
            subject: 'Новая заявка с формы',
            text: `Имя: ${name}\nТелефон: ${phone}\nКомментарий: ${comment}\nСогласие на обработку данных: ${agreement ? 'Да' : 'Нет'}`,
        };

        // Отправляем письмо
        await transporter.sendMail(mailOptions);

        return new Response(JSON.stringify({ message: 'Email sent successfully!' }), { status: 200 });
    } catch (error) {
        console.error('Error sending email:', error);
        return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 });
    }
}