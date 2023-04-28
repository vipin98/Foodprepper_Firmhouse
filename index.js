import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import  { request, gql } from 'graphql-request';
// import crypto from "crypto";
// import { orderStandardFoodbox } from './cron.js';
import { Shopify } from "@shopify/shopify-api";
// import cron from "node-cron";
// import nodemailer from "nodemailer";


const port = process.env.PORT || 3000;
const app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json());

// Run scheduled task to order standard foodbox
// orderStandardFoodbox();


app.use(cors());
// app.use(express.json());

async function verifyRequest(req, res, next) {
  const emailId = req.query.email || req.body.email;
  const keyId = req.query.id || req.body.id;
  const passId = req.query.key || req.body.key;
  const assembleName = emailId.toString() + keyId.toString();
  const calculatedSignature = calculateHexDigest(assembleName);
  const keygen = calculateMD5(calculatedSignature + MD5_KEY);
  if (keygen == passId) {
    next();
  } else {
    next("Failure to authenticate");
  }
}

app.listen(3000,()=>{
console.log("server is listiongS")
})
// app root blank placeholder
app.get("/", async (req, res) => {

  res.json("Just here to look good!");
});


// shopify customer company + vat name update
app.post("/company-Vat", urlencodedParser, async (req, res) => {
  
  const query = `
mutation {
  metafieldsSet(metafields:{
    key:"Company_name_Vat_number"
    namespace:"custom"
    ownerId:"gid://shopify/Customer/${req.body.id}"
    value:"${req.body.data}" 
  })
  {
    metafields{
      id
      description
      key
      namespace
      value
    }
  }
}
`
  try {
    const response = await axios({
      method: "post",
      url: "https://platter-o.myshopify.com/admin/api/2023-04/graphql.json",
      headers: {
        "X-Shopify-Access-Token": "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",
      },
      data: {
        query: query,
      },
    });

    if (res.statusCode == 200) {
      res.json(response.data);
    } else {
      res.status(400).send(`Unauthenticated Request`);
    }
  } catch (err) {
    console.log(err.response.data.errors);
  }
});






app.post('/billing-Address', urlencodedParser, async (req, res) => {
  const { customerId, metafields } = req.body;

  const query = gql`
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
          description
          key
          namespace
          value
      }
      userErrors {
        field
        message
        code
      }
    }
  }`

  
  

  const variables = {
    // id: `gid://shopify/Customer/${customerId}`,
    metafields: metafields.map(metafield => ({
      key: metafield.key,
      value: metafield.value,
      namespace: 'custom',
      ownerId: `gid://shopify/Customer/${customerId}`,
    })),
  };

  axios({
    method: 'post',
    url:'https://platter-o.myshopify.com/admin/api/2023-04/graphql.json',
    headers: {
      'X-Shopify-Access-Token': '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',
    },
    data: {
      query,
      variables,
    },
  })
    .then((response) => {
      console.log(response.data);
      if (response.data.data.metafieldsSet && response.data.data.metafieldsSet.metafields) {
        res.json(response.data.data.metafieldsSet.metafields);
      } else {
        res.status(400).send(`Failed to update metafields for customer with ID: ${customerId}`);
      }
    })
    .catch((error) => {
      console.log(error.response.data.errors);
      res.status(500).send('An error occurred while updating metafields');
    });
});
