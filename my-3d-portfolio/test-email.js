// Let's use standard built-in fetch
fetch('https://api.emailjs.com/api/v1.0/email/send', { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' }, 
  body: JSON.stringify({ 
    lib_version: '4.4.1', 
    user_id: 'WpjE5Pc9VrYIpasWg', 
    service_id: 'service_krb1z1x', 
    template_id: 'template_w41vw5j', 
    template_params: { from_name: 'Test', reply_to: 'test@example.com', project_type: 'seo', message: 'Test message 12345' } 
  }) 
})
.then(res => res.text().then(text => ({ status: res.status, text })))
.then(data => console.log('RESPONSE:', data))
.catch(err => console.error('ERROR:', err));
