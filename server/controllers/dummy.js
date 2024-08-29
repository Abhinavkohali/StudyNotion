

const crypto = require("crypto");


const dotenv=require('dotenv');
dotenv.config();


const SALT_KEY = process.env.SALT_KEY;
const MERCHANT_ID = process.env.MERCHANT_ID;
const KEY_INDEX = process.env.KEY_INDEX;

exports.newPayment = async (req, res) => {
  try {
      const merchantTransactionId = 'M' + Date.now();
      const amount = req.body.amount;
      const userId = Math.floor(Math.random() * 100000000) +"";

      const data = {
          merchantId: MERCHANT_ID,
          merchantTransactionId: merchantTransactionId,
          merchantUserId: 'MUID' + userId,
          amount: amount * 100,
          redirectUrl: `http://${process.env.DOMAIN}/donate/status/${merchantTransactionId}`,
          redirectMode: 'POST',
          paymentInstrument: {
              type: 'PAY_PAGE'
          }
      };

      const payload = JSON.stringify(data);
      const payloadMain = Buffer.from(payload).toString('base64');
      
      const string = payloadMain + '/pg/v1/pay' + SALT_KEY;
      const sha256 = crypto.createHash('sha256').update(string).digest('hex');
      const checksum = sha256 + '###' + KEY_INDEX;
      
      const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
      const options = {
          method: 'POST',
          url: prod_URL,
          headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
              'X-VERIFY': checksum
          },
          data: {
              request: payloadMain
          }
      };

      axios.request(options).then(function (response) {
          return res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
      }).catch(function (error) {
          console.error(error);
          res.status(500).send({
              message: error.message,
              success: false
          });
      });
      
  } catch (error) {
      res.status(500).send({
          message: error.message,
          success: false
      });
  }
};
exports.checkStatus = async (req, res) => {
    try {
      const merchantTransactionId = req.params['txnId'];
      const KEY_INDEX = 1;
      const string = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + SALT_KEY;
      const sha256 = crypto.createHash('sha256').update(string).digest('hex');
      const checksum = sha256 + "###" + KEY_INDEX;
      const options = {
        method: 'GET',
        url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': `${MERCHANT_ID}`
        }
      };
  
      axios.request(options).then(async (response) => {
        if (response.data.success === true) {
          const amount = response.data.data.amount / 100;
  
          let purpose;
          if (amount === 100) {
            purpose = "Support For Food";
          } else if (amount === 250) {
            purpose = "Support For Education";
          }
  
          const donationData = {
            donation_id: response.data.data.transactionId,
            name: "Anonymous",
            amount: amount,
            purpose: purpose,
          };
  
          const query = 'INSERT INTO donations (donation_id, name, amount, purpose) VALUES (?, ?, ?, ?)';
          const values = [donationData.donation_id, donationData.name, donationData.amount, donationData.purpose];
  
          db.query(query, values, (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).send({
                message: 'Failed to insert donation into database',
                success: false
              });
            }
  
            console.log('Donation inserted successfully');
            return res.redirect('/success');
          });
        } else {
          return res.redirect('/failure');
        }
      }).catch((err) => {
        console.error(err);
        return res.status(500).send({
          message: 'Failed to fetch status from PhonePe API',
          success: false
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: error.message,
        success: false
      });
    }
  };
  