#!/bin/bash
set -e
shopt -s extglob

rm -rf {rollup,webpack}/{dist_control,dist_experimental,package-lock.json,node_modules}

pack_package(){
	pushd ../packages/$1 > /dev/null
	realpath "$(npm pack)"
	popd > /dev/null
}

path_common=$(pack_package common)

setup_rollup(){
	path_rollup=$(pack_package rollup)
	pushd rollup
	npm i
	npm i --save-dev "$path_rollup"
	npm i --save-dev "$path_common"
	popd
}

setup_webpack(){
	path_webpack=$(pack_package webpack)
	pushd webpack
	npm i
	npm i --save-dev "$path_webpack"
	npm i --save-dev "$path_common"
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
