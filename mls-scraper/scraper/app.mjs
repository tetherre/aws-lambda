/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const removeSymbols = (string) => {
  return string.replace(/[!-\/:-@[-`{-~]/g, "");
};

async function redfinAddressScrape(mlsOrAddress) {
  try {
    console.log(chromium.args);

    const browser = await puppeteer.launch({
      args: chromium.args.concat([
        "--disable-features=site-per-process",
        "--hide-scrollbars",
        "--disable-web-security",
      ]),
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    page.setDefaultNavigationTimeout(0);

    await page.goto("https://www.redfin.com/");
    await page.waitForTimeout(5000);
    console.log("launched");

    console.log(mlsOrAddress);
    await page.type("#search-box-input", mlsOrAddress, { delay: 0 });

    // await page.waitForTimeout(5000);
    const clicker = await page.$(
      ".inline-block.SearchButton.clickable.float-right"
    );
    try {
      await page.evaluate((el) => {
        return el.click();
      }, clicker);
      await page.waitForTimeout(1500);
    } catch (e) {
      console.log("click error", e);
    }
    console.log("waiting");

    const infoX = await page.$$("[class='statsValue']");
    const [price, bedrooms, bathrooms, sqft] = await Promise.all([
      (await infoX[0].getProperty("textContent")).jsonValue(),
      (await infoX[1].getProperty("textContent")).jsonValue(),
      (await infoX[2].getProperty("textContent")).jsonValue(),
      (await infoX[3].getProperty("textContent")).jsonValue(),
    ]);
    console.log(price);
    console.log(bathrooms);
    console.log(bedrooms);
    console.log(sqft);

    const addressX = await page.$("[class='street-address']");
    const address = await (
      await addressX?.getProperty("textContent")
    )?.jsonValue();
    console.log("address: " + address);

    const cityStateZipX = await page.$("[class='dp-subtext bp-cityStateZip']");
    const cityStateZip = await (
      await cityStateZipX?.getProperty("textContent")
    )?.jsonValue();
    console.log(cityStateZip);
    const city = cityStateZip?.split(",")[0];
    const state = cityStateZip?.split(",")[1].split(" ")[1];
    const zip = cityStateZip?.split(",")[1].split(" ")[2];

    const lotSizeX = await page.$$("[class='table-value']");
    const lotSize = await (
      await lotSizeX[4].getProperty("textContent")
    ).jsonValue();
    console.log(lotSize);

    const mlsX = await page.$("[class='ListingSource--mlsId']");
    const mls = await (await mlsX?.getProperty("textContent"))?.jsonValue();
    console.log(mls);

    const previewX = await page.$(".landscape");
    const previewSrc = (await previewX?.getProperty("src"))?.jsonValue();
    const promise = new Promise((resolve) => {
      resolve(previewSrc);
    });
    const preview = await Promise.resolve(promise);
    console.log(preview);

    const pages = await browser.pages();
    await Promise.all(pages.map(async (page) => page.close()));
    console.log("closed");

    const res = {
      data: {
        preview: preview,
        mls: removeSymbols(mls),
        price: removeSymbols(price),
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        sqft: removeSymbols(sqft),
        lot_Size: lotSize,
        city: city,
        state: state,
        zip: zip,
      },
    };

    const mlsData = JSON.stringify(res);
    console.log(mlsData);

    return mlsData;
  } catch (error) {
    console.log("error at the scrape", error.message);
  }
}
//
//
//
// export const handler = async (event, context) => {
//     try {
//       console.log("started");
//       const body = JSON.parse(event.body);
//       const { mlsOrAddress } = body;

//       const data = await redfinAddressScrape(mlsOrAddress);
//       console.log("Handler Data:", data);

//       return {
//         statusCode: 200,
//         body: JSON.stringify(data),
//       };
//     } catch (error) {
//       console.log("error with index.js", error.message);
//       return {
//         statusCode: 500,
//         body: JSON.stringify({
//           message: error.message,
//         }),
//       };
//     }
//   };

export const lambdaHandler = async (event, context) => {
  try {
    return {
      statusCode: 200,
      body: await redfinAddressScrape(event.body),
    };
  } catch (err) {
    console.log(err);
    return err;
  }

  // return response;
};
