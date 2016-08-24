export const lyftPhoneAuth = (req, res) => {
  let phoneNumber = req.body.phoneNumber;
  console.log('phone number is ', phoneNumber);

  let url = CARVIS_HELPER_API + '/lyft/phoneauth';

  fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      },
      body: JSON.stringify(req.body) // pass through the body.
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log('success lyft phone auth', data);
    })
    .catch(function (err) {
      console.warn('err lyft phone auth', err);
    });

  res.json({ message: 'on its way' });
};

export const lyftPhoneCodeAuth = (req, res) => {
  let lyftCode = req.body.lyftCode;
  // let phoneNumber = req.body.phoneNumber;
  console.log('got code', lyftCode);

  let url = CARVIS_HELPER_API + '/lyft/phoneCodeAuth';

  fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      },
      body: JSON.stringify(req.body) // pass through body.
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log('success lyft phone code auth', data);
    })
    .catch(function (err) {
      console.warn('err lyft phone code auth', err);
    });

  res.json({ message: 'yes!' });
};

export const uberLogin = (req, res) => {
  let url = CARVIS_HELPER_API + '/uber/login';

  fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': CARVIS_HELPER_API_KEY
      },
      body: JSON.stringify(req.body) // pass through body.
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log('success uber login', data);
    })
    .catch(function (err) {
      console.warn('err uber login', err);
    });

  res.json({ message: 'on its way' });
};
