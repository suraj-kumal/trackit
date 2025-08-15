<?php

// namespace App\Providers;

// use App\Actions\Fortify\CreateNewUser;
// use App\Actions\Fortify\ResetUserPassword;
// use App\Actions\Fortify\UpdateUserPassword;
// use App\Actions\Fortify\UpdateUserProfileInformation;
// use Illuminate\Cache\RateLimiting\Limit;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\RateLimiter;
// use Illuminate\Support\ServiceProvider;
// use Illuminate\Support\Str;
// use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;
// use Laravel\Fortify\Fortify;
// use App\Models\User;

// use Illuminate\Support\Facades\Hash;

// // class FortifyServiceProvider extends ServiceProvider
// // {
// //     /**
// //      * Register any application services.
// //      */
// //     public function register(): void
// //     {
// //         //
// //     }

// //     /**
// //      * Bootstrap any application services.
// //      */
// //     public function boot(): void
// //     {
// //         Fortify::createUsersUsing(CreateNewUser::class);
// //         Fortify::updateUserProfileInformationUsing(UpdateUserProfileInformation::class);
// //         Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
// //         Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
// //         Fortify::redirectUserForTwoFactorAuthenticationUsing(RedirectIfTwoFactorAuthenticatable::class);

// //         RateLimiter::for('login', function (Request $request) {
// //             $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

// //             return Limit::perMinute(5)->by($throttleKey);
// //         });

// //         RateLimiter::for('two-factor', function (Request $request) {
// //             return Limit::perMinute(5)->by($request->session()->get('login.id'));
// //         });
// //     }
// // }
// class FortifyServiceProvider extends ServiceProvider
// {
//     public function register()
//     {
//         //
//     }

//     public function boot()
//     {
//         // Registration
//         Fortify::createUsersUsing(CreateNewUser::class);

//         // Login
//         Fortify::authenticateUsing(function (Request $request) {
//             $request->validate([
//                 'email' => 'required|email',
//                 'password' => 'required',
//             ]);

//             $user = User::where('email', $request->email)->first();

//             if ($user && Hash::check($request->password, $user->password)) {
//                 // return API token
//                 return $user;
//             }

//             return null;
//         });
//     }
// }


namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;
use App\Models\User;

class FortifyServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }

    public function boot()
    {
        // Tell Fortify we are not using views
        // (You should also set 'views' => false in config/fortify.php)
        Fortify::loginView(function () {
            abort(404);
        });

        Fortify::registerView(function () {
            abort(404);
        });

        // Registration
        Fortify::createUsersUsing(CreateNewUser::class);

        // Custom API Login
        Fortify::authenticateUsing(function (Request $request) {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            $user = User::where('email', $request->email)->first();

            if ($user && Hash::check($request->password, $user->password)) {
                return $user; // Fortify will consider this authenticated
            }

            return null;
        });
    }
}
