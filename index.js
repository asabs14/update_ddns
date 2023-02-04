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
  let GD_HOSTNAMES = req_body.gd_hostnames || process.env.GD_HOSTNAMES;
  let GD_USERNAMES = req_body.gd_usernames || process.env.GD_USERNAMES;
  let GD_PASSWORDS = req_body.gd_passwords || process.env.GD_PASSWORDS;
  if (!Array.isArray(GD_HOSTNAMES)) {
    GD_HOSTNAMES = [GD_HOSTNAMES];
    GD_USERNAMES = [GD_USERNAMES];
    GD_PASSWORDS = [GD_PASSWORDS];
  }
  
  // ZeroTier Request for Static Member Info
  console.log("Getting IP address...");
  var zt_url = `https://my.zerotier.com/api/v1/network/${ZT_NETWORKID}/member/${ZT_MEMBERID}`;
  axios
  .get(zt_url, {
    headers: {Authorization : `Bearer ${ZT_AUTH}`}}
  )
  .then(zt_res => {

  // Extract IP address
    var zt_memberIP = zt_res.data.physicalAddress;
    // Abort if member is offline
    if (!zt_memberIP) return res.status(500).send("Couldn't retrieve IP address; static member offline");
    
    console.log(`Retrieved IP: ${zt_memberIP}...`);

    // Update DDNS
    console.log("Updating DDNS...");
    // Google Domain Request to Update DDNS for all domains
    let promises = [];
    for (let i = 0; i < GD_HOSTNAMES.length; i++) {
      const gd_url = `https://${GD_USERNAMES[i]}:${GD_PASSWORDS[i]}@domains.google.com/nic/update`;
      const gd_hostname = GD_HOSTNAMES[i];
      promises.push(
        axios
        .get(gd_url, {
          params: {
            hostname: gd_hostname,
            myip: zt_memberIP
          }
        })
        .then(gd_res => {
          if(gd_res.data != "badauth") {
            return `${gd_hostname}: Success.`;
          } else return `${gd_hostname}: Fail (Bad Auth)`;
        })
        .catch(error => {
          console.error(error);
          return `${gd_hostname}: Fail (${error})`;
        })
      );
    };
    
    let responses = Promise.all(promises)
    .then((responses) => {
      console.log(responses);
      res.status(200).send(responses)
    });

})};