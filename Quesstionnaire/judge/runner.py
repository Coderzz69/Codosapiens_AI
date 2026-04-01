import json
import os
import subprocess
import sys
import time


def load_tests():
    with open('tests.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('tests', []), int(data.get('timeLimitMs', 2000))


def run_cmd(cmd, input_data, timeout_sec):
    start = time.perf_counter()
    try:
        proc = subprocess.run(
            cmd,
            input=input_data,
            text=True,
            capture_output=True,
            timeout=timeout_sec
        )
        elapsed = int((time.perf_counter() - start) * 1000)
        return proc.returncode, proc.stdout, proc.stderr, elapsed, None
    except subprocess.TimeoutExpired as e:
        elapsed = int((time.perf_counter() - start) * 1000)
        return -1, '', '', elapsed, 'TLE'


def normalize(out):
    return '\n'.join([line.rstrip() for line in out.strip().splitlines()]).strip()


def main():
    if len(sys.argv) < 2:
        print('Language required', file=sys.stderr)
        sys.exit(1)

    lang = sys.argv[1]
    tests, time_limit_ms = load_tests()
    compile_log = ''
    exec_log = ''
    verdict = 'AC'
    test_results = []

    exe_cmd = None
    if lang == 'c':
        compile_cmd = ['gcc', 'main.c', '-O2', '-std=c11', '-o', 'app']
    elif lang == 'cpp':
        compile_cmd = ['g++', 'main.cpp', '-O2', '-std=c++17', '-o', 'app']
    elif lang == 'py':
        compile_cmd = None
    else:
        compile_cmd = None

    if compile_cmd:
        code, out, err, _, _ = run_cmd(compile_cmd, '', 10)
        compile_log = (out or '') + (err or '')
        if code != 0:
            verdict = 'CE'
            write_results(verdict, 0, compile_log, '', [])
            return

    if lang == 'py':
        exe_cmd = ['python3', 'main.py']
    else:
        exe_cmd = ['./app']

    max_time = 0
    for t in tests:
        code, out, err, elapsed, error_kind = run_cmd(exe_cmd, t['input'], time_limit_ms / 1000.0)
        max_time = max(max_time, elapsed)
        ok = False
        status = 'AC'
        if error_kind == 'TLE':
            verdict = 'TLE'
            status = 'TLE'
        elif code != 0:
            verdict = 'RE'
            status = 'RE'
        else:
            expected = normalize(t['output'])
            actual = normalize(out)
            if expected == actual:
                ok = True
            else:
                verdict = 'WA' if verdict == 'AC' else verdict
                status = 'WA'

        test_results.append({
            'id': t['id'],
            'ok': ok,
            'status': status,
            'timeMs': elapsed,
            'weight': t.get('weight', 1),
            'expected': t['output'][:500],
            'actual': out[:500]
        })

        if verdict in ('TLE', 'RE'):
            exec_log += f"Test {t['id']} failed with {verdict}.\n"

    if verdict == 'AC' and any(not tr['ok'] for tr in test_results):
        verdict = 'WA'

    write_results(verdict, max_time, compile_log, exec_log, test_results)


def write_results(verdict, time_ms, compile_log, exec_log, test_results):
    payload = {
        'verdict': verdict,
        'timeMs': time_ms,
        'compileLog': compile_log,
        'execLog': exec_log,
        'testResults': test_results
    }
    with open('results.json', 'w', encoding='utf-8') as f:
        json.dump(payload, f)


if __name__ == '__main__':
    main()
