import { ref } from 'vue';

const province = ref();

export function useProvince() {
    function setProvince(value: any) {
        console.log(value)
        province.value = value;
    }

    return { province, setProvince };
}