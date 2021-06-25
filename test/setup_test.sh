#!/bin/bash
set -e
shopt -s extglob

rm -rf {rollup,webpack}/{dist_control,dist_experimental,package-lock.json,node_modules}

pack_package(){
	pushd ../packages/$1 > /dev/null
	local pack_path=$(realpath "$(npm pack)")
	popd > /dev/null
	cp "$pack_path" "package-$1.tgz"
}

pack_package common

setup_rollup(){
	pack_package rollup
	pushd rollup
	npm i
	popd
}

setup_webpack(){
	pack_package webpack
	pushd webpack
	npm i
	popd
}

case "$1" in
	rollup)
		setup_rollup
		;;
	webpack)
		setup_webpack
		;;
	"" | all)
		setup_rollup
		setup_webpack
		;;
	*)
		echo "Unknown component: $1"
		;;
esac
