// Google Apps Script to handle contact form submissions and send them to info@lifeprepacademyfoundation.com
// Instructions:
// 1. Deploy this script as a Web App in Google Apps Script editor.
// 2. Set access to 'Anyone' or 'Anyone, even anonymous' if your site is not authenticated.
// 3. Use the returned Web App URL as the form action in your HTML.

function doPost(e) {
  var params = e.parameter;
  var name = params.name || '';
  var email = params.email || '';
  var message = params.message || '';
  
  var subject = 'New Message From LifePrepAcademyFoundation.com';
  var body = 'Name: ' + name + '\nEmail: ' + email + '\nMessage: ' + message;
  
  MailApp.sendEmail({
    to: 'info@lifeprepacademyfoundation.com,hligon@getsparqd.com',
    subject: subject,
    body: body
  });
  
  return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
}
