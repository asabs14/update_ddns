/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.update_ddns = (req, res) => {

  const req_body = JSON.parse(req.body);

  const axios = require("axios");
  const ZT_AUTH = req_body.zt_auth || process.env.ZT_AUTH;
  const ZT_NETWORKID = req_body.zt_networkid || process.env.ZT_NETWORKID;
  const ZT_MEMBERID = req_body.zt_memberid || process.env.ZT_MEMBERID;
  const GD_USERNAME = req_body.gd_username || process.env.GD_USERNAME;
  const GD_PASSWORD = req_body.gd_password || process.env.GD_PASSWORD;
  const GD_HOSTNAME = req_body.gd_hostname || process.env.GD_HOSTNAME;
  
  // ZeroTier Request for Static Member Info
  console.log("Getting IP address...");
  var zt_url = `https://my.zerotier.com/api/v1/network/${ZT_NETWORKID}/member/${ZT_MEMBERID}`;
  axios
  .get(zt_url, {
    headers: {Authorization : `Bearer ${ZT_AUTH}`}}
  )
  .then(zt_res => {
    console.log(zt_res);

  // Extract IP address
    var zt_memberIP = zt_res.data.physicalAddress;
    // Abort if member is offline
    if (!zt_memberIP) return res.status(500).send("Couldn't retrieve IP address; static member offline");
    
    console.log(`Retrieved IP: ${zt_memberIP}...`);

    // Update DDNS
    console.log("Updating DDNS...");
    var gd_url = `https://${GD_USERNAME}:${GD_PASSWORD}@domains.google.com/nic/update`;
    // Google Domain Request to Update DDNS
    axios
    .get(gd_url, {
      params: {
        hostname: GD_HOSTNAME,
        myip: zt_memberIP
      }
    })
    .then(gd_res => {
      console.log(gd_res);
      return res.status(200).send("Successfully set DDNS.");
    })
    .catch(error => {
      console.error(error);
      return res.status(500).send("Couldn't set DDNS.");
    });
  })
  .catch(error => {
    console.error(error);
    return res.status(500).send("Couldn't retrieve ZT members.");
  });

};