import nodemailer from 'nodemailer'


export const sendEmail = async options => {
   const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
         user: process.env.EMAIL,
         pass: process.env.PASSWORD
      }
   })

   const mailOptions = {
      from: process.env.EMAIL,
      to: options.email,
      subject: options.subject,
      html: options.html
   }

   

   await transporter.sendMail(mailOptions)
}


export default sendEmail