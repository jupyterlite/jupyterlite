FROM emscripten/emsdk:2.0.27


ARG USER_ID
ARG GROUP_ID

# RUN addgroup --gid $GROUP_ID user
# RUN adduser --disabled-password --gecos '' --uid $USER_ID --gid $GROUP_ID user
# USER user

# # RUN apt-get update && \
# #     apt-get install -qqy doxygen git && \
# #     mkdir -p /opt/libvpx/build && \
# #     git clone https://github.com/webmproject/libvpx /opt/libvpx/src



RUN mkdir -p /install
RUN mkdir -p /install/lib



##################################################################
# xtl
##################################################################
RUN mkdir -p /opt/xtl/build && \
    git clone https://github.com/xtensor-stack/xtl.git  /opt/xtl/src

RUN cd /opt/xtl/build && \
    emcmake cmake ../src/   -DCMAKE_INSTALL_PREFIX=/install

RUN cd /opt/xtl/build && \
    emmake make -j8 install


##################################################################
# nloman json
##################################################################
RUN mkdir -p /opt/nlohmannjson/build && \
    git clone https://github.com/nlohmann/json.git /opt/nlohmannjson/src

RUN cd /opt/nlohmannjson/build && \
    emcmake cmake ../src/   -DCMAKE_INSTALL_PREFIX=/install -DJSON_BuildTests=OFF

RUN cd /opt/nlohmannjson/build && \
    emmake make -j8 install


##################################################################
# xeus itself
##################################################################

RUN mkdir -p /opt/nlohmannjson/build &&  \
   git clone -b wasm https://github.com/DerThorsten/xeus.git   /opt/xeus

# ADD xeus /opt/xeus

RUN cd /install/lib && echo "LS" && ls
RUN cd /install/include && echo "LS" && ls
RUN mkdir -p /xeus-build && cd /xeus-build  && ls &&\
    emcmake cmake  /opt/xeus \
        -DCMAKE_INSTALL_PREFIX=/install \
        -Dnlohmann_json_DIR=/install/lib/cmake/nlohmann_json \
        -Dxtl_DIR=/install/share/cmake/xtl \
        -DXEUS_EMSCRIPTEN_WASM_BUILD=ON
RUN cd /xeus-build && \
    emmake make -j4 install

##################################################################
# lua
##################################################################
RUN git clone https://github.com/DerThorsten/wasm_lua   /opt/wasm_lua
RUN cd /opt/wasm_lua && \
    emmake make



##################################################################
# xpropery
##################################################################
RUN mkdir -p /opt/xproperty/build && \
    git clone https://github.com/jupyter-xeus/xproperty.git  /opt/xproperty/src

RUN cd /opt/xproperty/build && \
    emcmake cmake ../src/   \
    -Dxtl_DIR=/install/share/cmake/xtl \
    -DCMAKE_INSTALL_PREFIX=/install

RUN cd /opt/xproperty/build && \
    emmake make -j8 install


##################################################################
# xwidgets
##################################################################
RUN mkdir -p /opt/xwidgets/build && \
    git clone -b master https://github.com/jupyter-xeus/xwidgets.git  /opt/xwidgets/src

RUN cd /opt/xwidgets/build && \
    emcmake cmake ../src/  \
    -Dxtl_DIR=/install/share/cmake/xtl \
    -Dxproperty_DIR=/install/lib/cmake/xproperty \
    -Dnlohmann_json_DIR=/install/lib/cmake/nlohmann_json \
    -Dxeus_DIR=/install/lib/cmake/xeus \
    -DXWIDGETS_BUILD_SHARED_LIBS=OFF \
    -DXWIDGETS_BUILD_STATIC_LIBS=ON  \
    -DCMAKE_INSTALL_PREFIX=/install \
    -DCMAKE_CXX_FLAGS="-s USE_PTHREADS=1 -pthread  -mbulk-memory  -matomics"
RUN cd /opt/xwidgets/build && \
    emmake make -j8 install



##################################################################
# xeus-lua
##################################################################

RUN mkdir -p /opt/nlomannjson/build &&  \
   git clone -b main https://github.com/DerThorsten/xeus-lua.git   /opt/xeus-lua

#COPY xeus-lua /opt/xeus-lua


RUN mkdir -p /xeus-lua-build && cd /xeus-lua-build  && ls && \
    emcmake cmake  /opt/xeus-lua \
        -DXEUS_LUA_EMSCRIPTEN_WASM_BUILD=ON \
        -DCMAKE_INSTALL_PREFIX=/install \
        -Dnlohmann_json_DIR=/install/lib/cmake/nlohmann_json \
        -Dxtl_DIR=/install/share/cmake/xtl \
        -Dxproperty_DIR=/install/lib/cmake/xproperty \
        -Dxwidgets_DIR=/install/lib/cmake/xwidgets \
        -DXLUA_WITH_XWIDGETS=ON\
        -DXLUA_USE_SHARED_XWIDGETS=OFF\
        -DLUA_INCLUDE_DIR=/opt/wasm_lua/lua-5.3.4/src \
        -DLUA_LIBRARY=/opt/wasm_lua/lua-5.3.4/src/liblua.a \
        -Dxeus_DIR=/install/lib/cmake/xeus 

RUN cd /xeus-lua-build && \
    emmake make -j8 

