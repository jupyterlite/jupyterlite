import 'mocha';

import createXeusModule from '../src/xeus_dummy';

// loading the c++ generated functions is
// an ansync operatoion..

createXeusModule().then((mymod: any) => {
  // multipart_t is an emscripten binded class
  const a = new mymod.multipart_t('a message');

  console.log(a.str());

  // run an c++ linear interpolation
  console.log(mymod.lerp(1, 4, 0.5));
});
