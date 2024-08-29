// // const { instance } = require("../config/razorpay")
// const Course = require("../models/Course")
// const crypto = require("crypto")
// const User = require("../models/User")
// const mailSender = require("../utils/mailSender")
// const mongoose = require("mongoose")
// const {
//   courseEnrollmentEmail,
// } = require("../mail/templates/courseEnrollmentEmail")
// const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail")
// const CourseProgress = require("../models/CourseProgress")

// const axios = require("axios");
// const dotenv = require('dotenv');
// dotenv.config();


// const SALT_KEY = process.env.SALT_KEY;
// const MERCHANT_ID = process.env.MERCHANT_ID;
// const KEY_INDEX = process.env.KEY_INDEX;

// // // Capture the payment and initiate the Razorpay order
// exports.capturePayment = async (req, res) => {
//   const { courses } = req.body
//   const userId = req.user.id
//   if (courses.length === 0) {
//     return res.json({ success: false, message: "Please Provide Course ID" })
//   }

//   let total_amount = 0

//   for (const course_id of courses) {
//     let course
//     try {
//       // Find the course by its ID
//       course = await Course.findById(course_id)

//       // If the course is not found, return an error
//       if (!course) {
//         return res
//           .status(200)
//           .json({ success: false, message: "Could not find the Course" })
//       }

//       // Check if the user is already enrolled in the course
//       const uid = new mongoose.Types.ObjectId(userId)
//       if (course.studentsEnroled.includes(uid)) {
//         return res
//           .status(200)
//           .json({ success: false, message: "Student is already Enrolled" })
//       }

//       // Add the price of the course to the total amount
//       total_amount += course.price
//     } catch (error) {
//       console.log(error)
//       return res.status(500).json({ success: false, message: error.message })
//     }
//   }
  
//   try {

//     const merchantTransactionId = 'M' + Date.now();
//     const amount = total_amount * 100;
//     // const userId = Math.floor(Math.random() * 100000000) +"";

//     const data = {
//       merchantId: MERCHANT_ID,
//       merchantTransactionId: merchantTransactionId,
//       merchantUserId: 'MUID' + userId,
//       amount: amount * 100,
//       redirectUrl: `http://127.0.0.1:4000/api/v1/payment/verifyPayment/${merchantTransactionId}`,
//       redirectMode: 'POST',
//       paymentInstrument: {
//         type: 'PAY_PAGE'
//       }
//     };

//     const payload = JSON.stringify(data);
//     const payloadMain = Buffer.from(payload).toString('base64');

//     const string = payloadMain + '/pg/v1/pay' + SALT_KEY;
//     const sha256 = crypto.createHash('sha256').update(string).digest('hex');
//     const checksum = sha256 + '###' + KEY_INDEX;

//     const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
//     const options = {
//       method: 'POST',
//       url: prod_URL,
//       headers: {
//         accept: 'application/json',
//         'Content-Type': 'application/json',
//         'X-VERIFY': checksum
//       },
//       data: {
//         request: payloadMain
//       }
//     };

//     axios.request(options).then(function (response) {
//       console.log(response.data);
      
//       return res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
//     }).catch(function (error) {
//       console.error(error);
//       res.status(500).send({
//         message: error.message,
//         success: false
//       });
//     });

//   } catch (error) {
//     res.status(500).send({
//       message: error.message,
//       success: false
//     });
//   }


//   // const options = {
//   //   amount: total_amount * 100,
//   //   currency: "INR",
//   //   receipt: Math.random(Date.now()).toString(),
//   // }

//   // try {
//   //   // Initiate the payment using Razorpay
//   //   const paymentResponse = await instance.orders.create(options)
//   //   console.log(paymentResponse)
//   //   res.json({
//   //     success: true,
//   //     data: paymentResponse,
//   //   })
//   // } catch (error) {
//   //   console.log(error)
//   //   res
//   //     .status(500)
//   //     .json({ success: false, message: "Could not initiate order." })
//   // }
// }

// // verify the payment
// exports.verifyPayment = async (req, res) => {
//   const razorpay_order_id = req.body?.razorpay_order_id
//   const razorpay_payment_id = req.body?.razorpay_payment_id
//   const razorpay_signature = req.body?.razorpay_signature
//   const courses = req.body?.courses

//   const userId = req.user.id

//   if (
//     !razorpay_order_id ||
//     !razorpay_payment_id ||
//     !razorpay_signature ||
//     !courses ||
//     !userId
//   ) {
//     return res.status(200).json({ success: false, message: "Payment Failed" })
//   }

//   let body = razorpay_order_id + "|" + razorpay_payment_id

//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_SECRET)
//     .update(body.toString())
//     .digest("hex")

//   if (expectedSignature === razorpay_signature) {
//     await enrollStudents(courses, userId, res)
//     return res.status(200).json({ success: true, message: "Payment Verified" })
//   }

//   return res.status(200).json({ success: false, message: "Payment Failed" })
// }

// // Send Payment Success Email
// exports.sendPaymentSuccessEmail = async (req, res) => {
//   const { orderId, paymentId, amount } = req.body

//   const userId = req.user.id

//   if (!orderId || !paymentId || !amount || !userId) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Please provide all the details" })
//   }

//   try {
//     const enrolledStudent = await User.findById(userId)

//     await mailSender(
//       enrolledStudent.email,
//       `Payment Received`,
//       paymentSuccessEmail(
//         `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
//         amount / 100,
//         orderId,
//         paymentId
//       )
//     )
//   } catch (error) {
//     console.log("error in sending mail", error)
//     return res
//       .status(400)
//       .json({ success: false, message: "Could not send email" })
//   }
// }

// // enroll the student in the courses
// const enrollStudents = async (courses, userId, res) => {
//   if (!courses || !userId) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Please Provide Course ID and User ID" })
//   }

//   for (const courseId of courses) {
//     try {
//       // Find the course and enroll the student in it
//       const enrolledCourse = await Course.findOneAndUpdate(
//         { _id: courseId },
//         { $push: { studentsEnroled: userId } },
//         { new: true }
//       )

//       if (!enrolledCourse) {
//         return res
//           .status(500)
//           .json({ success: false, error: "Course not found" })
//       }
//       console.log("Updated course: ", enrolledCourse)

//       const courseProgress = await CourseProgress.create({
//         courseID: courseId,
//         userId: userId,
//         completedVideos: [],
//       })
//       // Find the student and add the course to their list of enrolled courses
//       const enrolledStudent = await User.findByIdAndUpdate(
//         userId,
//         {
//           $push: {
//             courses: courseId,
//             courseProgress: courseProgress._id,
//           },
//         },
//         { new: true }
//       )

//       console.log("Enrolled student: ", enrolledStudent)
//       // Send an email notification to the enrolled student
//       const emailResponse = await mailSender(
//         enrolledStudent.email,
//         `Successfully Enrolled into ${enrolledCourse.courseName}`,
//         courseEnrollmentEmail(
//           enrolledCourse.courseName,
//           `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
//         )
//       )

//       console.log("Email sent successfully: ", emailResponse.response)
//     } catch (error) {
//       console.log(error)
//       return res.status(400).json({ success: false, error: error.message })
//     }
//   }
// }

