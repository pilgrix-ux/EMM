cmake_minimum_required(VERSION 3.22.1)

project(emm_native LANGUAGES CXX)

add_library(
    emm_native
    SHARED
    native_renderer.cpp
)

target_compile_features(emm_native PRIVATE cxx_std_17)
target_compile_options(
    emm_native
    PRIVATE
    -Wall
    -Wextra
    -Werror=return-type
)

target_link_libraries(emm_native PRIVATE log GLESv3)
